// Vals SAGE v1 (the archived first version, whose cost columns are token prices, so no per-task cost is kept) on
// vals.ai, read through the helper in vals-index.ts.
import type { Leaderboard } from './types.ts';
import { VALS_ALIASES, VALS_TERMS, valsPage, valsRows } from './vals-index.ts';

const SLUG = 'sage-v1';

const board: Leaderboard = {
  benchmark: 'vals-sage',
  url: valsPage(SLUG),
  feed: `${valsPage(SLUG)} (server-rendered leaderboard table)`,
  terms: VALS_TERMS,
  aliases: VALS_ALIASES,
  fetch: () => valsRows(SLUG, { cost: null }),
};
export default board;
