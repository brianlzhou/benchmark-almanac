// Vals Vibe Code Bench 1-100 on vals.ai, read through the helper in vals-index.ts.
// Rows also carry latency (and, where the chart data has them, output tokens and the 95% interval) from the
// page's chart data, which the board's scatter can plot against latency.
import type { Leaderboard } from './types.ts';
import { VALS_ALIASES, VALS_LATENCY_CHART, VALS_TERMS, valsPage, valsRows } from './vals-index.ts';

const SLUG = 'vcb-1-100';

const board: Leaderboard = {
  benchmark: 'vals-vibe-code-bench-1-100',
  url: valsPage(SLUG),
  feed: `${valsPage(SLUG)} (server-rendered leaderboard table)`,
  terms: VALS_TERMS,
  chart: VALS_LATENCY_CHART,
  aliases: VALS_ALIASES,
  fetch: () => valsRows(SLUG),
};
export default board;
