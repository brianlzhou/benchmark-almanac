// RULERv2 average percentage from the official evaluation guide, with context-length scores retained.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://raw.githubusercontent.com/NVIDIA-NeMo/Skills/main/docs/evaluation/long-context.md";
const board: Leaderboard = {
 benchmark: "ruler-v2",
 url: "https://github.com/NVIDIA-NeMo/Skills/blob/main/docs/evaluation/long-context.md",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 aliases: {'Qwen3-235B-A22B-Instruct-2507':'qwen3-235b-a22b-instruct-jul-2025'},
 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
  const t = markdownTables(await fetchText(FEED)).find(t=>t[0].includes('Avg'));
  if (!t) throw new Error('ruler-v2 table missing');
  const rows = t.slice(1).filter(r=>r[0] && !/human|random/i.test(r[0]) && num(r[1])!==undefined).map(r=>({
    model:r[0].replace(/ Think (On|Off)$/,''),setting:r[0].match(/Think (On|Off)$/)?.[0], score:num(r[1])!*1, 
    metrics:Object.fromEntries(t[0].map((h,i)=>[h, i!==0 && i!==1 ? num(r[i]) : undefined]).filter((p): p is [string,number]=>typeof p[1]==='number')),
  }));
  if (!rows.length) throw new Error('ruler-v2 has no scored rows');
  return rows;
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?(?:pro|flash)|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
