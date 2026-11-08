// VisualProbe: hard-split accuracy is the headline percentage; medium and easy remain metrics.
// Only rows with an actual VisualProbe score are imported. Other benchmarks in the comparison table are excluded.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText, fetchJson, parseCsv } from '../lib/util.ts';
import { num, text, tables, jsonAfter } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://raw.githubusercontent.com/Mini-o3/Mini-o3/HEAD/README.md";
const board: Leaderboard = {
 benchmark: "visualprobe",
 url: "https://github.com/Mini-o3/Mini-o3",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
  const t=markdownTables(await fetchText(FEED)).find(t=>t[0].includes('VisualProbe hard'));
  if(!t)throw new Error('VisualProbe table missing');
  return t.slice(1).filter(r=>num(r[1])!==undefined).map(r=>({model:r[0].replace(/[†‡]/g,''),score:num(r[1])!,setting:'hard',metrics:{medium:num(r[2])!,easy:num(r[3])!}}));
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
