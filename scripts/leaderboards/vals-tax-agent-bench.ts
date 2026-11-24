// Vals Tax Agent Bench (the Accuracy column is the all-pass accuracy) on vals.ai, read through the helper in vals-index.ts.
// Rows also carry output tokens, latency, the 95% interval and turns per test from the page's chart data, and
// `weightedPass`, the weighted pass rate (0 to 100) that the page's bar chart sets beside the all-pass accuracy.
import type { Leaderboard } from './types.ts';
import { VALS_ALIASES, VALS_LATENCY_CHART, VALS_TERMS, valsPage } from './vals-index.ts';

import { VALS_DETAILS_STATS, valsDetails } from '../lib/boards/vals-details.ts';

const SLUG = 'tax_agent_bench';

const board: Leaderboard = {
  benchmark: 'vals-tax-agent-bench', measures: { weightedPass: 'weighted' },
  url: valsPage(SLUG),
  feed: `${valsPage(SLUG)} (server-rendered leaderboard table)`,
  terms: VALS_TERMS,
  chart: VALS_LATENCY_CHART,
  stats: { ...VALS_DETAILS_STATS, turns: { name: 'Turns per test', unit: 'count', better: 'lower' } },
  aliases: VALS_ALIASES,
  fetch: () => valsDetails(board, SLUG, { tasks: { weightedPass: 'weighted_pass' } }),
};
export default board;
