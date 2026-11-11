// InteractiveBench: use the published Overall pass percentage.
// Task-group pass rates, completion rate and capability scores remain metrics. The source script is parsed, never executed.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import {jsLiteral} from '../lib/html.ts';
const FEED = "https://meta-interactiveworld.github.io/assets/results.js?v=23";
const board: Leaderboard = {
 benchmark: "interactivebench",
 url: "https://meta-interactiveworld.github.io/",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
const s=await fetchText(FEED);const read=(key:string)=>{const at=s.indexOf('const '+key+' =');return jsLiteral<any[]>(s,s.indexOf('[',at));};const groups=read('GROUPS'),caps=read('CAPS');return read('MODELS').flatMap(r=>r.t2.map((v:number[],i:number)=>({model:r.name,score:v[0],setting:groups[i].label,metrics:{completionRate:v[1],...Object.fromEntries(caps.map((c,j)=>['capability '+c.key,r.caps[j]]))}})));
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.filter(r => r.setting === 'Overall').map(r => ({...r, setting:undefined,
    metrics:{...r.metrics,...Object.fromEntries(result.filter(x => x.model===r.model && x.setting!=='Overall')
      .map(x => [x.setting!.toLowerCase(),x.score]))}, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
