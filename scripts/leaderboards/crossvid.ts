// CrossVid: O.Avg is overall accuracy in percent on cross-video reasoning.
// Frame counts and C.Avg, T.Avg, M.Avg and CCQA metrics stay attached to each result.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://raw.githubusercontent.com/chuntianli666/CrossVid/HEAD/README.md";
const board: Leaderboard = {
 benchmark: "crossvid",
 url: "https://github.com/chuntianli666/CrossVid",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
  const t=markdownTables(await fetchText(FEED)).find(t=>t[0].includes('O.Avg'));
  if(!t)throw new Error('CrossVid table missing');
  return t.slice(1).filter(r=>num(r[3])!==undefined).map(r=>({model:r[1],score:num(r[3])!,setting:`frames=${r[2]}`,
    metrics:Object.fromEntries([4,5,6,7].map(i=>[t[0][i],num(r[i])!]))}));
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
