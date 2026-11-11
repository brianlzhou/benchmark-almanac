// R-Bench: Absolute Overall is the first published ranking, converted to percent.
// Relative robustness is a different metric, retained on matching absolute rows.
// Task and perturbation-strength scores remain secondary metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { num, tables } from '../lib/html.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const FEED = "https://raw.githubusercontent.com/Q-Future/R-Bench/HEAD/README.md";
const board: Leaderboard = {
 benchmark: "r-bench-robustness",
 url: "https://github.com/Q-Future/R-Bench",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",

 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
  const ts=markdownTables(await fetchText(FEED)).filter(t=>['Absolute','Relative'].includes(t[0][0]));
  if(ts.length!==2)throw new Error('R-Bench robustness tables missing');
  const absolute = ts.find(t => t[0][0] === 'Absolute')!;
  const relative = ts.find(t => t[0][0] === 'Relative')!;
  return absolute.slice(1).filter(r=>num(r[10])!==undefined).map(r=>{
    const rel = relative.slice(1).find(v => v[0] === r[0]);
    return {model:r[0],score:num(r[10])!*100,
      metrics:{...Object.fromEntries([1,2,3,4,5,6,7,8,9].map(i=>[absolute[0][i],num(r[i])!*100])),
        ...(rel && num(rel[10])!==undefined ? {relative:num(rel[10])!*100} : {})}};
  });

  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:GeminiPro|gpt[- ]?4o|gpt[- ]?4(?:[- ]?turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
