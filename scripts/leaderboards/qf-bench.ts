// QF-Bench V11 CLI pass@1 percentage. Discover the current app bundle and parse its data without execution; preserve pass@3, task count, date and harness.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import {jsLiteral} from '../lib/html.ts';
const FEED = "https://qfbench.com/";
const board: Leaderboard = {
 benchmark: "qf-bench",
 url: "https://qfbench.com/_next/static/chunks/61f73a6a71588000.js",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
const html=await fetchText(FEED);const urls=[...new Set([...html.matchAll(/src="([^"]+\.js)"/g)].map(m=>new URL(m[1],FEED).href))];for(const u of urls){const s=await fetchText(u);const at=s.indexOf('[{rank:1,model:');if(at<0)continue;const rows=jsLiteral<any[]>(s,at);if(!rows.every(r=>typeof r.passRate==='number'))continue;return rows.map(r=>({model:r.model,score:r.passRate,harness:r.agent,setting:'V11 CLI',date:r.date,metrics:{passAt3:r.passAt3,tasks:r.tasks}}));}throw new Error('QF V11 table missing');
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
