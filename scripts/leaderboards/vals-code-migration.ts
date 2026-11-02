// Vals Code Migration v1 (the archived first version, while v1.1 is vals-code-migration-1-1) on vals.ai, read through
// the helper in vals-index.ts.
import type { Leaderboard } from './types.ts';
import { VALS_ALIASES, VALS_TERMS, valsPage, valsRows } from './vals-index.ts';

const SLUG = 'code-migration';

const board: Leaderboard = {
  benchmark: 'vals-code-migration',
  url: valsPage(SLUG),
  feed: `${valsPage(SLUG)} (server-rendered leaderboard table)`,
  terms: VALS_TERMS,
  aliases: VALS_ALIASES,
  fetch: () => valsRows(SLUG),
};
export default board;
