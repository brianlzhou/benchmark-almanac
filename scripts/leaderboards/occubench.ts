// OccuBench clean-environment average success percentage and separate robustness environments. The dimensionless robustness ratio remains a metric.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import {jsLiteral} from '../lib/html.ts';
const FEED = "https://gregxmhu.github.io/OccuBench-website/";
const board: Leaderboard = {
 benchmark: "occubench",
 url: "https://gregxmhu.github.io/OccuBench-website/",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
const s=await fetchText(FEED);const read=(key:string)=>{const at=s.indexOf('const '+key+' =');return jsLiteral<any[]>(s,s.indexOf('[',at));};const rows:LeaderboardRow[]=read('e0Data').map(r=>({model:r.model,score:r.avg,setting:'E0 clean environment',metrics:Object.fromEntries(Object.entries(r).filter(([k,v])=>k!=='avg'&&typeof v==='number')) as Record<string,number>}));
for(const r of read('robData'))for(const k of ['e1','e2','e3'])rows.push({model:r.model,score:r[k],setting:k.toUpperCase()+' robustness environment',metrics:{robustnessRatio:r.rob}});return rows;
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
