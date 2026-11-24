// Vals Index v2.1: the version-specific official board reports accuracy percentage and per-test cost.
// The shared Vals reader also preserves available output-token usage, latency and confidence intervals.
// The chart reproduces the board’s accuracy-versus-cost comparison.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { valsRows, VALS_ALIASES, VALS_STATS } from './vals-index.ts';
const FEED = "https://www.vals.ai/benchmarks/vals_index_v2_1";
const TASKS = { vibe_code_bench: 'vibe_code_bench', finance_agent: 'finance_agent', emb: 'emb', code_migration: 'code_migration', legal_research: 'legal_research', legal_agent_benchmark: 'legal_agent_benchmark', terminal_bench_4: 'terminal_bench_4', tax_agent_bench: 'tax_agent_bench' };
const board: Leaderboard = {
 benchmark: "vals-index-v2-1",
 url: "https://www.vals.ai/benchmarks/vals_index_v2_1",
 feed: FEED,
 terms: "Public source published by the benchmark authors; source licensing and attribution requirements apply.",
 aliases: Object.fromEntries(Object.entries(VALS_ALIASES).filter(([name])=>name!=='GPT 4o')),
 parts: {
  vibe_code_bench: { name: 'Vibe Code Bench', group: 'Benchmark' },
  finance_agent: { name: 'Finance Agent v2', group: 'Benchmark' },
  emb: { name: 'EMB', group: 'Benchmark' },
  code_migration: { name: 'Code Migration', group: 'Benchmark' },
  legal_research: { name: 'Legal Research', group: 'Benchmark' },
  legal_agent_benchmark: { name: 'HLAB', group: 'Benchmark' },
  terminal_bench_4: { name: 'Terminal-Bench 4.0', group: 'Benchmark' },
  tax_agent_bench: { name: 'Tax Agent', group: 'Benchmark' },
 },
 stats: VALS_STATS,
 chart:{title:'Accuracy versus cost',x:{key:'cost',label:'Cost per test',unit:'$',better:'lower',log:true},y:{key:'score',label:'Accuracy',unit:'%',better:'higher'}},
 async fetch(): Promise<LeaderboardRow[]> {
  const result = await (async (): Promise<LeaderboardRow[]> => {
  return (await valsRows('vals_index_v2_1', { tasks: TASKS })).map(r=>({...r,metrics:{...r.metrics,...(r.cost!==undefined?{cost:r.cost}:{})}}));
  })();
  // Undated families have multiple snapshots in the registry; keep these entries unlisted.
  return result.map(r => ({...r, model: !r.date && /^(?:gpt[- ]?4o|gpt[- ]?4(?:[- ]turbo)?|gemini[- ]?1[.]5[- ]?(?:pro|flash)|gemini[- ]?2[.]5[- ]?pro|claude[- ]?3[.]5[- ]?sonnet|deepseek[- ]?(?:v3|r1))$/i.test(r.model) ? `${r.model} (snapshot unspecified)` : r.model}));
 },
};
export default board;
