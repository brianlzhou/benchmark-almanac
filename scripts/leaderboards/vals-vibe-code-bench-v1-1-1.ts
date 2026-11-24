// Vals Vibe Code Bench v1.1.1 (updated browser-use verification and all-substeps pass grading; Harness column
// kept) on vals.ai, read through valsDetails in scripts/lib/boards/vals-details.ts.
// Rows carry output tokens, latency, the 95% confidence interval (±1.96 standard errors as low/high and
// ciLow/ciHigh), headline standard error (metrics.stderr), turns per test, and token totals from the page's
// chart data. The site draws accuracy against cost per test from row.cost, and VALS_LATENCY_CHART redraws
// the page's scatter chart with its x axis switched to Latency.
import type { Leaderboard } from './types.ts';
import { VALS_ALIASES, VALS_LATENCY_CHART, VALS_TERMS, valsPage } from './vals-index.ts';
import { VALS_DETAILS_STATS, valsDetails } from '../lib/boards/vals-details.ts';

const SLUG = 'vibe-code-v1-1-1';
const {
  avg_input_tokens: _i,
  avg_output_tokens: _o,
  avg_reasoning_tokens: _r,
  avg_cache_read_tokens: _cr,
  avg_cache_write_tokens: _cw,
  ...VIBE_CODE_STATS
} = VALS_DETAILS_STATS;

const board: Leaderboard = {
  benchmark: 'vals-vibe-code-bench-v1-1-1',
  url: valsPage(SLUG),
  feed: `${valsPage(SLUG)} (server-rendered leaderboard table and chart data)`,
  terms: VALS_TERMS,
  chart: VALS_LATENCY_CHART,
  stats: {
    ...VIBE_CODE_STATS,
    turns: { name: 'Turns per test', unit: 'count', better: 'lower' },
  },
  aliases: VALS_ALIASES,
  async fetch() {
    const rows = await valsDetails(board, SLUG, { score: 'Score', harness: 'Harness' });
    if (rows.length < 20) throw new Error(`Vibe Code Bench v1.1.1: ${rows.length} rows, expected at least 20`);
    return rows;
  },
};
export default board;
