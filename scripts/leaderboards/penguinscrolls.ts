// PenguinScrolls micro-average percentage with category and context-length metrics from the official README.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://raw.githubusercontent.com/Penguin-Scrolls/PenguinScrolls/master/README.md";
const board: Leaderboard = {
 benchmark: "penguinscrolls",
 url: "https://github.com/Penguin-Scrolls/PenguinScrolls",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
const ts=markdownTables(await fetchText(FEED));const t=ts.find(t=>t[0].includes('Micro Avg'))!;const lengths=ts.find(t=>t[0].some(h=>h.includes('0K-8K')))!;
return t.slice(1).map(r=>{const l=lengths.find(l=>l[0]===r[0]);return {model:r[0],score:num(r[1])!,metrics:Object.fromEntries([...t[0].slice(2).map((h,i)=>[h,num(r[i+2])]),...(l?lengths[0].slice(1).map((h,i)=>[h,num(l[i+1])]):[])].filter((p):p is [string,number]=>typeof p[1]==='number'))};});
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
