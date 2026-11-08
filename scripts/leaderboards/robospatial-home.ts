// RoboSpatial Home: Total is the official aggregate percentage across configuration, compatibility and pointing.
// All available component scores are retained without inventing values for the table’s missing cells.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text, tables, jsonAfter } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://raw.githubusercontent.com/chanhee-luke/RoboSpatial-Eval/HEAD/README.md";
const board: Leaderboard = {
 benchmark: "robospatial-home",
 url: "https://github.com/chanhee-luke/RoboSpatial-Eval",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
  const ts=markdownTables(await fetchText(FEED)).filter(t=>t[0][0]==='Model' && t[0].includes('Total'));
  if(!ts.length)throw new Error('RoboSpatial tables missing');
  return ts.flatMap(t=>t.slice(1).filter(r=>num(r[5])!==undefined).map(r=>({model:r[0],score:num(r[5])!,
    metrics:Object.fromEntries([1,2,3,4].filter(i=>num(r[i])!==undefined).map(i=>[t[0][i],num(r[i])!]))})));

  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?(?:pro|flash)|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
