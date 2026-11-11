// RoboMemArena: official overall task success rate across Tasks 1 through 26.
// The simulation board is the default. Real-world tasks are separate and excluded. Component success remains a metric.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://robomemarena.github.io/leaderboard_data.json";
const board: Leaderboard = {
  benchmark: "robomemarena",
  url: "https://robomemarena.github.io/leaderboard_data.json",
  feed: FEED,
  terms: "The public source permits automated reading under robots.txt, subject to its license and attribution requirements.",
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = await (async (): Promise<LeaderboardRow[]> => {
      const d=await fetchJson<any>(FEED);return d.entries.filter((r:any)=>r.protocol==='Simulation').map((r:any)=>({model:r.method,score:r.overall_tsr,metrics:{componentSuccess:r.overall_csr,transfer:r.transfer_tsr,occlusion:r.occlusion_tsr,counting:r.counting_tsr,sequence:r.sequence_tsr}}));
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
