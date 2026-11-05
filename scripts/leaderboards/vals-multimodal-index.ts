// Vals Multimodal Index on vals.ai, read through the helper in vals-index.ts.
// valsRows adds latency, the 95% CI and output tokens where the page has them; the board redraws the page's
// accuracy-against-latency view (VALS_LATENCY_CHART).
import type { Leaderboard } from './types.ts';
import { VALS_ALIASES, VALS_LATENCY_CHART, VALS_TERMS, valsPage, valsRows } from './vals-index.ts';

const SLUG = 'vals_multimodal_index';

const board: Leaderboard = {
  benchmark: 'vals-multimodal-index',
  url: valsPage(SLUG),
  feed: `${valsPage(SLUG)} (server-rendered leaderboard table)`,
  terms: VALS_TERMS,
  aliases: VALS_ALIASES,
  chart: VALS_LATENCY_CHART,
  fetch: () => valsRows(SLUG),
};
export default board;
