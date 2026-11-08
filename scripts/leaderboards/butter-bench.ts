// Butter-Bench paper: published Avg completion percentage across all tasks.
// These static paper rows will not refresh. End-to-end completion and intermediate tasks remain metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { tables, num, text, jsonAfter, jsLiteral } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://arxiv.org/html/2510.21860";
const board: Leaderboard = {
  benchmark: "butter-bench",
  url: "https://arxiv.org/html/2510.21860",
  feed: FEED,
  terms: "The public source permits automated reading under robots.txt, subject to its license and attribution requirements.",
  async fetch(): Promise<LeaderboardRow[]> {
    const rows: LeaderboardRow[] = await (async (): Promise<LeaderboardRow[]> => {
      const t=tables(await fetchText(FEED)).find(t=>t[0]?.[0]?.text==='Task:'&&t[0]?.at(-1)?.text==='Avg');if(!t)throw new Error('Butter results missing');return t.slice(1).filter(r=>r.length===8).map(r=>({model:r[0].text,score:num(r[7].text)!,metrics:Object.fromEntries(t[0].slice(1,7).map((k,i)=>[k.text.toLowerCase(),num(r[i+1].text)!]))}));
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
