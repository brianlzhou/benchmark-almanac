// MMAU-Pro: the official project page loads results.json with average accuracy in percent.
// All published audio-category scores remain metrics; random and human baselines are excluded.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchJson } from '../lib/util.ts';

const FEED = "https://sonalkum.github.io/mmau-pro/results.json";
const board: Leaderboard = {
 benchmark: "mmau-pro",
 url: "https://github.com/sonalkum/MMAUPro",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
  const data=await fetchJson<{model:string;size:string;scores:Record<string,number|null>}[]>(FEED);
  return data.filter(r=>!/^Human$|^Random/i.test(r.model) && typeof r.scores.average==='number').map(r=>({
    model:r.model,score:r.scores.average!,setting:r.size!=='-'?`size=${r.size}`:undefined,
    metrics:Object.fromEntries(Object.entries(r.scores).filter((p):p is [string,number]=>p[0]!=='average' && typeof p[1]==='number'))
  }));
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?(?:pro|flash)|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
