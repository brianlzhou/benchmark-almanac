// AutoElicit: this registry record measures transferred-prompt elicitation. Use the published Overall
// transfer success rate across all 117 perturbations (success in at least one of three runs).
// Source-agent rates are secondary metrics. Optimization-domain studies are not this benchmark score.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, text, tables } from '../lib/html.ts';

const FEED = "https://osu-nlp-group.github.io/AutoElicit/";
const board: Leaderboard = {
 benchmark: "autoelicit",
 url: "https://osu-nlp-group.github.io/AutoElicit/",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
const ts=tables(await fetchText(FEED)); const rows:LeaderboardRow[]=[];
for(const r of ts[1])if(r.length===4&&num(r[3].text)!==undefined)rows.push({model:r[0].text,score:num(r[3].text)!,setting:'3 runs',harness:'AutoElicit',metrics:{fromHaiku:num(r[1].text)!,fromOpus:num(r[2].text)!}});
return rows;
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
