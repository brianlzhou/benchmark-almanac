// Vals Multimodal Index on vals.ai, read through the helper in vals-index.ts.
// valsRows adds latency, the 95% CI and output tokens where the page has them; the board redraws the page's
// accuracy-against-latency view (VALS_LATENCY_CHART).
import type { Leaderboard } from './types.ts';
import { VALS_ALIASES, VALS_LATENCY_CHART, VALS_STATS, VALS_TERMS, valsPage, valsRows } from './vals-index.ts';

const SLUG = 'vals_multimodal_index';
const TASKS = { finance_agent: 'finance_agent', corp_fin_v2: 'corp_fin_v2', swebench: 'swebench', sage: 'sage', mortgage_tax: 'mortgage_tax', vibe_code_bench: 'vibe_code_bench', terminal_bench_2_1: 'terminal_bench_2_1' };

const board: Leaderboard = {
  benchmark: 'vals-multimodal-index',
  url: valsPage(SLUG),
  feed: `${valsPage(SLUG)} (server-rendered leaderboard table)`,
  terms: VALS_TERMS,
  aliases: VALS_ALIASES,
  parts: {
    finance_agent: { name: 'Finance Agent v2', group: 'Benchmark' },
    corp_fin_v2: { name: 'CorpFin v2', group: 'Benchmark' },
    swebench: { name: 'SWE-bench', group: 'Benchmark' },
    sage: { name: 'SAGE', group: 'Benchmark' },
    mortgage_tax: { name: 'Mortgage Tax', group: 'Benchmark' },
    vibe_code_bench: { name: 'Vibe Code Bench', group: 'Benchmark' },
    terminal_bench_2_1: { name: 'Terminal-Bench 2.1', group: 'Benchmark' },
  },
  stats: VALS_STATS,
  chart: VALS_LATENCY_CHART,
  fetch: () => valsRows(SLUG, { tasks: TASKS }),
};
export default board;
