// EmoBench-M official average percentage, with FER, CEU, and SCEA as component metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://raw.githubusercontent.com/Emo-gml/EmoBench-M/main/README.md";
const board: Leaderboard = {
 benchmark: "emobench-m",
 url: "https://github.com/Emo-gml/EmoBench-M",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 aliases: { 'Qwen2.5-VL-Instruct-7B': 'qwen2-5-vl-7b', 'Qwen2.5-VL-Instruct-32B': 'qwen2-5-vl-32b', 'Qwen2.5-VL-Instruct-72B': 'qwen2-5-vl-72b' },
 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
  const t = markdownTables(await fetchText(FEED)).find(t=>t[0].includes('Avg.'));
  if (!t) throw new Error('emobench-m table missing');
  const rows = t.slice(1).filter(r=>r[0] && !/human|random/i.test(r[0]) && num(r[4])!==undefined).map(r=>({
    model:r[0].replace(/^[^A-Za-z0-9]+/,''), score:num(r[4])!*1, 
    metrics:Object.fromEntries(t[0].map((h,i)=>[h, i!==0 && i!==4 ? num(r[i]) : undefined]).filter((p): p is [string,number]=>typeof p[1]==='number')),
  }));
  if (!rows.length) throw new Error('emobench-m has no scored rows');
  return rows;
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
