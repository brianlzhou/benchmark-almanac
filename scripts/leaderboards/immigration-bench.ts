// Immigration Bench (share of expert rubric items met on the private 262-question test set) on vals.ai, read through the helper in vals-index.ts.
import type { Leaderboard } from './types.ts';
import { VALS_ALIASES, VALS_TERMS, valsPage, valsRows } from './vals-index.ts';

const SLUG = 'immigration';

const board: Leaderboard = {
  benchmark: 'immigration-bench',
  url: valsPage(SLUG),
  feed: `${valsPage(SLUG)} (server-rendered leaderboard table)`,
  terms: VALS_TERMS,
  aliases: VALS_ALIASES,
  stats: { latency: { name: 'Time per task', unit: 'seconds', better: 'lower' } },
  fetch: () => valsRows(SLUG),
};
export default board;
