// STALE overall percentage and type-specific memory intervention metrics from the official README.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text, tables, jsonAfter } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://raw.githubusercontent.com/icedreamc/STALE/main/README.md";
const board: Leaderboard = {
 benchmark: "stale-memory",
 url: "https://github.com/icedreamc/STALE",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
  const t = markdownTables(await fetchText(FEED)).find(t=>t[0].includes('Overall'));
  if (!t) throw new Error('stale-memory table missing');
  const rows = t.slice(1).filter(r=>r[0] && !/human|random/i.test(r[0]) && num(r[7])!==undefined).map(r=>({
    model:r[0], score:num(r[7])!*1, 
    metrics:Object.fromEntries(t[0].map((h,i)=>[h, i!==0 && i!==7 ? num(r[i]) : undefined]).filter((p): p is [string,number]=>typeof p[1]==='number')),
  }));
  if (!rows.length) throw new Error('stale-memory has no scored rows');
  return rows;
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
