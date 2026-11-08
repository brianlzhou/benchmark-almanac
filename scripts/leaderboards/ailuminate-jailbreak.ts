// MLCommons AILuminate Jailbreak official hazard percentage. Anonymous system identities remain unlisted; risk interval bounds come from the published HTML data attributes.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text, tables, jsonAfter } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://ailuminate.mlcommons.org/benchmarks/security/0.5-en_us-official-ensemble";
const board: Leaderboard = {
 benchmark: "ailuminate-jailbreak",
 url: "https://ailuminate.mlcommons.org/benchmarks/security/0.5-en_us-official-ensemble",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
const s=await fetchText(FEED);const rows:LeaderboardRow[]=[];
for(const m of s.matchAll(/<h3 class="security-sut-header">([^<]+)<\/h3>([\s\S]*?)(?=<h3 class="security-sut-header">|<\/section>)/g)){
 const part=m[2].split('<p>Security Jailbreak Hazard')[1];if(!part)continue;const get=(k:string)=>num(part.match(new RegExp('data-risk-'+k+'="([^" ]+)"'))?.[1]);const score=get('estimate');if(score===undefined)continue;rows.push({model:m[1],score,setting:'0.5 en-US official ensemble',metrics:{ciLow:get('lower')!,ciHigh:get('upper')!}});}
return rows;
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
