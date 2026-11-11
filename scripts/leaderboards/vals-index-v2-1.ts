// Vals Index v2.1: the version-specific official board reports accuracy percentage and per-test cost.
// The shared Vals reader also preserves available output-token usage, latency and confidence intervals.
// The chart reproduces the board’s accuracy-versus-cost comparison.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { valsRows, VALS_ALIASES } from './vals-index.ts';
const FEED = "https://www.vals.ai/benchmarks/vals_index_v2_1";
const board: Leaderboard = {
 benchmark: "vals-index-v2-1",
 url: "https://www.vals.ai/benchmarks/vals_index_v2_1",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",
 aliases: Object.fromEntries(Object.entries(VALS_ALIASES).filter(([name])=>name!=='GPT 4o')),
 chart:{title:'Accuracy versus cost',x:{key:'cost',label:'Cost per test',unit:'$',better:'lower',log:true},y:{key:'score',label:'Accuracy',unit:'%',better:'higher'}},
 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
  return (await valsRows('vals_index_v2_1')).map(r=>({...r,metrics:{...r.metrics,...(r.cost!==undefined?{cost:r.cost}:{})}}));
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
