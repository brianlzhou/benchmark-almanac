// RoboMemArena: official overall task success rate across Tasks 1 through 26.
// The simulation board is the default. Real-world tasks are separate and excluded. Component success remains a metric.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://robomemarena.github.io/leaderboard_data.json";
const board: Leaderboard = {
  benchmark: "robomemarena",
  parts: {
    transfer: { name: 'Transfer', group: 'Task type' },
    occlusion: { name: 'Occlusion', group: 'Task type' },
    counting: { name: 'Counting', group: 'Task type' },
    sequence: { name: 'Sequence', group: 'Task type' },
  },
  url: "https://robomemarena.github.io/leaderboard_data.json",
  feed: FEED,
  terms: "The public source permits automated reading under robots.txt, subject to its license and attribution requirements.",
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = await (async (): Promise<LeaderboardRow[]> => {
      const data = await fetchJson<any>(FEED);
      return data.entries.filter((r: any) => r.protocol === 'Simulation').map((r: any) => ({
        model: r.method,
        score: r.overall_tsr,
        agentOrg: r.affiliation || undefined,
        models: r.vlm && r.vlm !== '-' && r.vla && r.vla !== '-' ? [r.vlm, r.vla] : undefined,
        metrics: {
          componentSuccess: r.overall_csr,
          transfer: r.transfer_tsr, occlusion: r.occlusion_tsr, counting: r.counting_tsr, sequence: r.sequence_tsr,
          transferComponentSuccess: r.transfer_csr, occlusionComponentSuccess: r.occlusion_csr,
          countingComponentSuccess: r.counting_csr, sequenceComponentSuccess: r.sequence_csr,
        },
      }));
    })();
    if (!rows.length) throw new Error('No whole-benchmark scores found');
    const seen = new Set<string>();
    for (const r of rows) {
      if (!r.model || !Number.isFinite(r.score)) throw new Error('Invalid model or score');
      if (r.score < 0 || r.score > 100) throw new Error('Score outside percent range');
      if (/^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model)) r.model += ' (snapshot unspecified)';
      const key = JSON.stringify([r.model, r.setting, r.harness]);
      if (seen.has(key)) throw new Error('Duplicate model configuration: ' + key);
      seen.add(key);
    }
    return rows;
  },
};
export default board;
