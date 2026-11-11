// LiveMathBench-202412 mG-Pass@16 percentage from the first release-specific table. Greedy and G-Pass threshold metrics remain components.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://raw.githubusercontent.com/open-compass/GPassK/main/README.md";
const board: Leaderboard = {
 benchmark: "livemathbench",
 url: "https://github.com/open-compass/GPassK",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
  const t = markdownTables(await fetchText(FEED)).find(t=>t[0].includes('mG-Pass@16'));
  if (!t) throw new Error('livemathbench table missing');
  const rows = t.slice(1).filter(r=>r[0] && !/human|random/i.test(r[0]) && num(r[5])!==undefined).map(r=>({
    model:r[0].replace(/[^\x00-\x7F]/g,'').trim(), score:num(r[5])!*1, setting:"LiveMathBench-202412; mG-Pass@16",
    metrics:Object.fromEntries(t[0].map((h,i)=>[h, i!==0 && i!==5 ? num(r[i]) : undefined]).filter((p): p is [string,number]=>typeof p[1]==='number')),
  }));
  if (!rows.length) throw new Error('livemathbench has no scored rows');
  return rows;
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
