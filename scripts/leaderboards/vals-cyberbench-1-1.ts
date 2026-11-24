// Vals CyberBench (the current version, 1.1) on vals.ai, read through the helper in vals-index.ts.
// Rows also carry output tokens, latency, the 95% interval and turns per test from the page's chart data.
import type { Leaderboard } from './types.ts';
import { VALS_ALIASES, VALS_LATENCY_CHART, VALS_STATS, VALS_TERMS, valsPage, valsRows } from './vals-index.ts';

const SLUG = 'cyber';

const board: Leaderboard = {
  benchmark: 'vals-cyberbench-1-1',
  url: valsPage(SLUG),
  feed: `${valsPage(SLUG)} (server-rendered leaderboard table)`,
  terms: VALS_TERMS,
  chart: VALS_LATENCY_CHART,
  aliases: VALS_ALIASES,
  parts: { poc: { name: 'PoC', group: 'Task' }, patch: { name: 'Patch', group: 'Task' } },
  stats: VALS_STATS,
  fetch: () => valsRows(SLUG, { tasks: { poc: 'poc', patch: 'patch' } }),
};
export default board;
