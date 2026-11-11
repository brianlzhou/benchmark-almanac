// Charades-STA: R@1 at IoU 0.5 is the primary published recall percentage.
// All three CTRL configurations remain separate, with stricter-IoU and top-five recall metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://raw.githubusercontent.com/jiyanggao/TALL/HEAD/README.md";
const board: Leaderboard = {
 benchmark: "charades-sta",
 url: "https://github.com/jiyanggao/TALL",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
  const t = markdownTables(await fetchText(FEED)).find(t=>t[0].includes('R@1,IoU=0.5'));
  if (!t) throw new Error('charades-sta table missing');
  const rows = t.slice(1).filter(r=>r[0] && !/human|random/i.test(r[0]) && num(r[1])!==undefined).map(r=>({
    model:r[0], score:num(r[1])!*1, setting:"R@1, IoU=0.5",
    metrics:Object.fromEntries(t[0].map((h,i)=>[h, i!==0 && i!==1 ? num(r[i]) : undefined]).filter((p): p is [string,number]=>typeof p[1]==='number')),
  }));
  if (!rows.length) throw new Error('charades-sta has no scored rows');
  return rows;
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
