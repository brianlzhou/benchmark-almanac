// Omni-Cloze: the official Omni-Captioner README publishes three benchmark accuracy percentages.
// The importer reads the benchmark-specific performance table at the repository head.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text, tables, jsonAfter } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://raw.githubusercontent.com/ddlBoJack/Omni-Captioner/HEAD/README.md";
const board: Leaderboard = {
 benchmark: "omni-cloze",
 url: "https://github.com/ddlBoJack/Omni-Captioner",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
  const t = markdownTables(await fetchText(FEED)).find(t=>t[0].includes('Omni-Cloze'));
  if (!t) throw new Error('omni-cloze table missing');
  const rows = t.slice(1).filter(r=>r[0] && !/human|random/i.test(r[0]) && num(r[1])!==undefined).map(r=>({
    model:r[0], score:num(r[1])!*1, 
    metrics:Object.fromEntries(t[0].map((h,i)=>[h, i!==0 && i!==1 ? num(r[i]) : undefined]).filter((p): p is [string,number]=>typeof p[1]==='number')),
  }));
  if (!rows.length) throw new Error('omni-cloze has no scored rows');
  return rows;
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
