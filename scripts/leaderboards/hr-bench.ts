// HR-Bench: Avg. is the published mean accuracy percentage across 4K and 8K images.
// Both resolution accuracies and the DC² scaffold are retained. The human baseline is excluded.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text, tables, jsonAfter } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://raw.githubusercontent.com/DreamMr/HR-Bench/HEAD/README.md";
const board: Leaderboard = {
 benchmark: "hr-bench",
 url: "https://github.com/DreamMr/HR-Bench",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
  const t=markdownTables(await fetchText(FEED)).find(t=>t[0].some(h=>h.includes('HR-Bench 4K')));
  if(!t)throw new Error('HR-Bench mini-leaderboard missing');
  return t.slice(1).filter(r=>!/^Human/i.test(r[0]) && num(r[3])!==undefined).map(r=>{
    let model=r[0].replace(/[🥇🥈🥉]/gu,'').trim(); const scaffold=model.match(/\s+w\/.*$/);
    if(scaffold)model=model.slice(0,scaffold.index).trim();
    const snapshot=model.match(/\((gpt-4o-\d{4}-\d\d-\d\d)\)/)?.[1];
    return {model:snapshot??model,harness:scaffold?'DC²':undefined,score:num(r[3])!,metrics:{accuracy4K:num(r[1])!,accuracy8K:num(r[2])!}};
  });
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
