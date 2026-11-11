// OmniSpatial: Overall accuracy is the percentage in the official README leaderboard.
// Four spatial capability scores are retained. The human upper-bound row is not a model.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://raw.githubusercontent.com/qizekun/OmniSpatial/HEAD/README.md";
const board: Leaderboard = {
 benchmark: "omnispatial",
 url: "https://github.com/qizekun/OmniSpatial",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
  const t = markdownTables(await fetchText(FEED)).find(t=>t[0].includes('Overall ↑'));
  if (!t) throw new Error('omnispatial table missing');
  const rows = t.slice(1).filter(r=>r[1] && !/human|random/i.test(r[1]) && num(r[2])!==undefined).map(r=>({
    model:r[1], score:num(r[2])!*1, 
    metrics:Object.fromEntries(t[0].map((h,i)=>[h, i!==1 && i!==2 ? num(r[i]) : undefined]).filter((p): p is [string,number]=>typeof p[1]==='number')),
  }));
  if (!rows.length) throw new Error('omnispatial has no scored rows');
  return rows;
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
