// WARC-Bench test success percentages. Trajectory-level and step-level evaluation remain distinct, with development rates and named CUA harnesses.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text, tables, jsonAfter } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://raw.githubusercontent.com/sanjari-orb/warc-bench/main/README.md";
const board: Leaderboard = {
 benchmark: "warc-bench",
 url: "https://github.com/sanjari-orb/warc-bench",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
return markdownTables(await fetchText(FEED)).filter(t=>t[0].includes('Test Success Rate')).flatMap((t,i)=>t.slice(1).map(r=>{const date=r[0].match(/\((\d{4}-\d\d-\d\d)\)/)?.[1];const cua=/ with CUA/.test(r[0]);return {model:r[0].replace(/\s*\(\d{4}-\d\d-\d\d\)/,'').replace(/ with CUA/,'').replace(/^OpenAI /,''),score:num(r[2])!,setting:i===0?'trajectory-level':'step-level',harness:cua?'CUA':undefined,date,metrics:{devSuccessRate:num(r[1])!}};}));
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
