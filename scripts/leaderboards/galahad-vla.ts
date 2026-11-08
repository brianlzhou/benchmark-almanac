// Galahad current named-object reach percentages from the official project page. Policy checkpoints remain undisclosed and unlisted; superseded drafts and benchmark-completion claims are not substituted for the battery results.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text, tables, jsonAfter } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://xn--7xa.monster/Galahad/";
const board: Leaderboard = {
 benchmark: "galahad-vla",
 url: "https://xn--7xa.monster/Galahad/",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
const s=text(await fetchText(FEED));const base=s.match(/base policy reaches the named object on (\d+) of (\d+) trials/);const repair=s.match(/same policy reaches the named object on ([\d.]+)% of trials across (\w+) seeds/);if(!base||!repair)throw new Error('Galahad current results missing');return [{model:'Galahad base policy (checkpoint undisclosed)',score:Number(base[1])/Number(base[2])*100,setting:'counterfactual battery; named-object reach',metrics:{successes:Number(base[1]),trials:Number(base[2])}},{model:'Galahad repaired policy (checkpoint undisclosed)',score:Number(repair[1]),setting:'deconfounded demonstrations; rank-32 update; named-object reach'}];
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
