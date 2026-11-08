// Big Sleep: pass@1 success percentage from the official embedded chart configuration.
// The importer decodes published chart data without executing the chart.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://deepmind.google/blog/introducing-gemini-3-5-flash-cyber/";
const board: Leaderboard = {
  benchmark: "big-sleep-evaluation-google",
  url: "https://deepmind.google/blog/introducing-gemini-3-5-flash-cyber/",
  feed: FEED,
  terms: "The public source permits automated reading under robots.txt, subject to its license and attribution requirements.",
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = await (async (): Promise<LeaderboardRow[]> => {
      const s=await fetchText(FEED);
      for(const m of s.matchAll(/src="([^"]*config=[^"]+)"/g)){
        const u=new URL(m[1].replace(/&amp;/g,'&')); const c=JSON.parse(u.searchParams.get('config')!);
        if(c.title?.text==='Big Sleep Evaluation')return c.data.map((r:any)=>({model:r.label,score:r.y}));
      }throw new Error('Big Sleep chart missing');
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
