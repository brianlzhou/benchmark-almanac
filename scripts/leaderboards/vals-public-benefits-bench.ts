// Vals Public Benefits Bench on vals.ai, read through the helper in vals-index.ts.
import type { Leaderboard } from './types.ts';
import { VALS_ALIASES, VALS_LATENCY_CHART, VALS_TERMS, valsPage, valsRows } from './vals-index.ts';

const SLUG = 'public-benefits-bench';

const board: Leaderboard = {
  benchmark: 'vals-public-benefits-bench',
  url: valsPage(SLUG),
  feed: `${valsPage(SLUG)} (server-rendered leaderboard table)`,
  terms: VALS_TERMS,
  aliases: VALS_ALIASES,
  chart: VALS_LATENCY_CHART,
  fetch: () => valsRows(SLUG),
};
export default board;
