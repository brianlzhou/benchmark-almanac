// Reka Research-Eval: Score is average accuracy across five runs, in percent.
// The README prices 1,000 requests, so cost is divided by 1,000 to give USD per request; search harnesses remain explicit.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text, tables, jsonAfter } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://raw.githubusercontent.com/reka-ai/research-eval/HEAD/README.md";
const board: Leaderboard = {
 benchmark: "research-eval-reka",
 url: "https://github.com/reka-ai/research-eval",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
  const t=markdownTables(await fetchText(FEED)).find(t=>t[0].includes('Score') && t[0].includes('Cost'));
  if(!t)throw new Error('Research-Eval table missing');
  return t.slice(1).filter(r=>num(r[1])!==undefined).map(r=>{
    const m=r[0].match(/^(.*?)\s*\(w\/\s*(.*?)\)$/);
    return {model:m?m[1]:r[0],harness:m?.[2],score:num(r[1])!,cost:num(r[2])!/1000};
  });
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
