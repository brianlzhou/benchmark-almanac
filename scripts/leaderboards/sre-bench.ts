// Vals SRE Bench (site reliability incidents) on vals.ai, read through the helper in vals-index.ts.
// Rows also carry output tokens, latency, the 95% interval and turns per test from the page's chart data.
import type { Leaderboard } from './types.ts';
import { VALS_ALIASES, VALS_LATENCY_CHART, VALS_TERMS, valsPage, valsRows } from './vals-index.ts';

const SLUG = 'srebench';

const board: Leaderboard = {
  benchmark: 'sre-bench',
  url: valsPage(SLUG),
  feed: `${valsPage(SLUG)} (server-rendered leaderboard table)`,
  terms: VALS_TERMS,
  chart: VALS_LATENCY_CHART,
  aliases: VALS_ALIASES,
  fetch: () => valsRows(SLUG),
};
export default board;
