// Vals Multimodal Index v1: Vals AI runs the board. Read with the shared Vals reader: accuracy with its interval, cost per test,
// latency and output tokens where the page gives them.
import type { Leaderboard } from './types.ts';
import { valsRows, valsPage, VALS_LATENCY_CHART, VALS_STATS, VALS_TERMS, VALS_ALIASES } from './vals-index.ts';

const SLUG = 'vals_multimodal_index_v1';
const TASKS = { finance_agent: 'finance_agent', corp_fin_v2: 'corp_fin_v2', swebench: 'swebench', terminal_bench_2: 'terminal_bench_2', sage: 'sage', mortgage_tax: 'mortgage_tax', vibe_code_bench: 'vibe_code_bench' };
const board: Leaderboard = {
  benchmark: 'vals-multimodal-index-v1',
  url: valsPage(SLUG),
  feed: `${valsPage(SLUG)} (the page's results table, through the shared Vals reader)`,
  terms: VALS_TERMS,
  aliases: VALS_ALIASES,
  parts: {
    finance_agent: { name: 'Finance Agent v1.1', group: 'Benchmark' },
    corp_fin_v2: { name: 'CorpFin v2', group: 'Benchmark' },
    swebench: { name: 'SWE-bench Verified', group: 'Benchmark' },
    terminal_bench_2: { name: 'Terminal-Bench 2.0', group: 'Benchmark' },
    sage: { name: 'SAGE', group: 'Benchmark' },
    mortgage_tax: { name: 'Mortgage Tax', group: 'Benchmark' },
    vibe_code_bench: { name: 'Vibe Code Bench', group: 'Benchmark' },
  },
  stats: VALS_STATS,
  chart: VALS_LATENCY_CHART,
  async fetch() {
    const rows = await valsRows(SLUG, { tasks: TASKS });
    if (rows.length < 3) throw new Error(`Vals Multimodal Index v1: ${rows.length} models, expected at least 3`);
    return rows;
  },
};
export default board;
