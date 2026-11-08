// KoMT-Bench official model comparison scores. The transposed dataset-card table supplies each published model and its judge score.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text, tables, jsonAfter } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://huggingface.co/datasets/LGAI-EXAONE/KoMT-Bench/raw/main/README.md";
const board: Leaderboard = {
 benchmark: "komt-bench",
 url: "https://huggingface.co/datasets/LGAI-EXAONE/KoMT-Bench",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
const t=markdownTables(await fetchText(FEED)).find(t=>t[1]?.[0]==='KoMT-Bench')!;return t[0].slice(1).map((model,i)=>({model,score:num(t[1][i+1])!}));
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
