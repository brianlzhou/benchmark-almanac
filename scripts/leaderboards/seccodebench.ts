// SecCodeBench: the published summary.averageScore over all 98 cases and scenarios.
// Pass rate is a secondary metric. Agent scaffolds are harnesses. Individual cases are never rows.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://alibaba.github.io/sec-code-bench/json/model-test-summary.json";
const board: Leaderboard = {
  benchmark: "seccodebench",
  url: "https://alibaba.github.io/sec-code-bench",
  feed: FEED,
  terms: "The public source permits automated reading under robots.txt, subject to its license and attribution requirements.",
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = await (async (): Promise<LeaderboardRow[]> => {
      const d=await fetchJson<any>(FEED);
      return d.modelResults.map((r:any)=>{const parts=r.modelName.split(' + ');return {model:parts.pop(),harness:parts.join(' + ')||undefined,score:r.summary.averageScore,metrics:{passRate:r.summary.passRate,cases:r.summary.totalTestCases}};});
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
