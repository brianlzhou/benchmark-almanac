// MLCommons AILuminate Jailbreak official hazard percentage. Anonymous system identities remain unlisted; risk interval bounds come from the published HTML data attributes.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';

const FEED = "https://ailuminate.mlcommons.org/benchmarks/security/0.5-en_us-official-ensemble";
const board: Leaderboard = {
 benchmark: "ailuminate-jailbreak",
 url: "https://ailuminate.mlcommons.org/benchmarks/security/0.5-en_us-official-ensemble",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",
 stats: {
  naiveHazard: { name: 'Naive hazard rate', unit: '%', better: 'lower', note: 'Baseline hazard rate without jailbreak attacks on the 0.5 en-US demo split.' },
 },

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
const s=await fetchText(FEED);const rows:LeaderboardRow[]=[];
for(const m of s.matchAll(/<h3 class="security-sut-header">([^<]+)<\/h3>([\s\S]*?)(?=<h3 class="security-sut-header">|<\/section>)/g)){
 const naivePart=m[2].split('<p>Security Naive Hazard')[1]?.split('<p>Security Jailbreak Hazard')[0];
 const naive=naivePart?num(naivePart.match(/data-risk-estimate="([^" ]+)"/)?.[1]):undefined;
 const part=m[2].split('<p>Security Jailbreak Hazard')[1];if(!part)continue;const get=(k:string)=>num(part.match(new RegExp('data-risk-'+k+'="([^" ]+)"'))?.[1]);const score=get('estimate');if(score===undefined)continue;rows.push({model:m[1],score,low:get('lower'),high:get('upper'),setting:'0.5 en-US official ensemble',metrics:{ciLow:get('lower')!,ciHigh:get('upper')!,...(naive!==undefined?{naiveHazard:naive}:{})}});}
return rows;
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
