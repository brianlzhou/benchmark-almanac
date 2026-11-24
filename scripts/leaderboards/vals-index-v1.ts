// Vals Index v1: the version-specific official board reports accuracy percentage and per-test cost.
// The shared Vals reader also preserves available output-token usage, latency and confidence intervals.
// The chart reproduces the board’s accuracy-versus-cost comparison.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { valsRows, VALS_ALIASES, VALS_STATS } from './vals-index.ts';
const FEED = "https://www.vals.ai/benchmarks/vals_index_v1";
const TASKS = { finance_agent: 'finance_agent', corp_fin_v2: 'corp_fin_v2', swebench: 'swebench', terminal_bench_2: 'terminal_bench_2', vibe_code_bench: 'vibe_code_bench' };
const board: Leaderboard = {
 benchmark: "vals-index-v1",
 url: "https://www.vals.ai/benchmarks/vals_index_v1",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",
 aliases: Object.fromEntries(Object.entries(VALS_ALIASES).filter(([name])=>name!=='GPT 4o')),
 parts: {
  finance_agent: { name: 'Finance Agent v1.1', group: 'Benchmark' },
  corp_fin_v2: { name: 'CorpFin v2', group: 'Benchmark' },
  swebench: { name: 'SWE-bench Verified', group: 'Benchmark' },
  terminal_bench_2: { name: 'Terminal-Bench 2.0', group: 'Benchmark' },
  vibe_code_bench: { name: 'Vibe Code Bench', group: 'Benchmark' },
 },
 stats: VALS_STATS,
 chart:{title:'Accuracy versus cost',x:{key:'cost',label:'Cost per test',unit:'$',better:'lower',log:true},y:{key:'score',label:'Accuracy',unit:'%',better:'higher'}},
 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
  return (await valsRows('vals_index_v1', { tasks: TASKS })).map(r=>({...r,metrics:{...r.metrics,...(r.cost!==undefined?{cost:r.cost}:{})}}));
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
