// MedMCQA official test accuracy. Published fractions are converted to percentages; context settings and development accuracy remain explicit.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, text, tables } from '../lib/html.ts';

const FEED = "https://medmcqa.github.io";
const board: Leaderboard = {
 benchmark: "medmcqa",
 url: "https://medmcqa.github.io",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
return tables(await fetchText(FEED)).flatMap((t,i)=>t.slice(2).filter(r=>r.length===5&&num(r[3].text)!==undefined).map(r=>({model:r[1].text.replace(/\s*\([^)]*\)/g,'').trim(),score:num(r[3].text)!*100,setting:i===0?'without context':'with context',metrics:{devAccuracy:num(r[4].text)!*100}})));
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
