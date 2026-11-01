// Vals Code Migration v1.1 (same tasks as v1, Pi agent harness, revised hidden tests) on vals.ai, read through the helper in vals-index.ts.
import type { Leaderboard } from './types.ts';
import { VALS_ALIASES, VALS_TERMS, valsPage, valsRows } from './vals-index.ts';

const SLUG = 'code-migration-v1-1';

const board: Leaderboard = {
  benchmark: 'vals-code-migration-1-1',
  url: valsPage(SLUG),
  feed: `${valsPage(SLUG)} (server-rendered leaderboard table)`,
  terms: VALS_TERMS,
  aliases: VALS_ALIASES,
  fetch: () => valsRows(SLUG),
};
export default board;
