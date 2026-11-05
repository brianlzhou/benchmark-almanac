// Vals IOI (the current version, on the newer IOI problem set) on vals.ai, read through the helper in
// vals-index.ts.
import type { Leaderboard } from './types.ts';
import { VALS_ALIASES, VALS_LATENCY_CHART, VALS_TERMS, valsPage, valsRows } from './vals-index.ts';

const SLUG = 'ioi';

const board: Leaderboard = {
  benchmark: 'vals-ioi-2',
  url: valsPage(SLUG),
  feed: `${valsPage(SLUG)} (server-rendered leaderboard table)`,
  terms: VALS_TERMS,
  aliases: VALS_ALIASES,
  chart: VALS_LATENCY_CHART,
  fetch: () => valsRows(SLUG),
};
export default board;
