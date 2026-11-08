// MAEB v1: default Mean(Task), scaled to the displayed 0-to-100 score.
// The current API renamed the beta benchmark. Only published whole-benchmark aggregates qualify. Category scores remain metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://mteb-leaderboard-backend.hf.space/v1/benchmarks/MAEB%28v1%29/scores";
const board: Leaderboard = {
  benchmark: "maeb",
  url: "https://mteb-leaderboard-backend.hf.space/v1/benchmarks/MAEB%28v1%29/scores",
  feed: FEED,
  terms: "The public source permits automated reading under robots.txt, subject to its license and attribution requirements.",
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = await (async (): Promise<LeaderboardRow[]> => {
      const d=await fetchJson<any>(FEED);return d.rows.filter((r:any)=>typeof r.meanTask==='number').map((r:any)=>({model:r.model.name.replace(/^[^/]+\//,''),score:r.meanTask*100,metrics:Object.fromEntries(Object.entries(r.scoresByTaskType).filter(([,v])=>typeof v==='number').map(([k,v])=>[k,(v as number)*100]))}));
    })();
    if (!rows.length) throw new Error('No whole-benchmark scores found');
    const seen = new Set<string>();
    for (const r of rows) {
      if (!r.model || !Number.isFinite(r.score)) throw new Error('Invalid model or score');
      if (/^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model)) r.model += ' (snapshot unspecified)';
      const key = JSON.stringify([r.model, r.setting, r.harness]);
      if (seen.has(key)) throw new Error('Duplicate model configuration: ' + key);
      seen.add(key);
    }
    return rows;
  },
};
export default board;
