// Vals Vibe Code Bench v1.1 (the canonical v1.1 test set; the Harness column is kept) on vals.ai, read through the helper in vals-index.ts.
// Rows also carry output tokens, latency, the 95% interval and turns per test from the page's chart data.
import type { Leaderboard } from './types.ts';
import { VALS_ALIASES, VALS_LATENCY_CHART, VALS_TERMS, valsPage } from './vals-index.ts';

import { VALS_DETAILS_STATS, valsDetails } from '../lib/boards/vals-details.ts';

const SLUG = 'vibe-code';

const board: Leaderboard = {
  benchmark: 'vibe-code-bench',
  url: valsPage(SLUG),
  feed: `${valsPage(SLUG)} (server-rendered leaderboard table)`,
  terms: VALS_TERMS,
  chart: VALS_LATENCY_CHART,
  stats: { ...VALS_DETAILS_STATS, turns: { name: 'Turns per test', unit: 'count', better: 'lower' } },
  aliases: VALS_ALIASES,
  fetch: () => valsDetails(board, SLUG, { score: 'Score', harness: 'Harness' }),
};
export default board;
