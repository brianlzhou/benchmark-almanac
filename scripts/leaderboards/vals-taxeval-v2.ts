// Vals TaxEval v2 (archived by Vals; its cost column is token prices, so no cost per task) on vals.ai, read through the helper in vals-index.ts.
import type { Leaderboard } from './types.ts';
import { VALS_ALIASES, VALS_TERMS, valsPage, valsRows } from './vals-index.ts';

const SLUG = 'tax_eval_v2';

const board: Leaderboard = {
  benchmark: 'vals-taxeval-v2',
  url: valsPage(SLUG),
  feed: `${valsPage(SLUG)} (server-rendered leaderboard table)`,
  terms: VALS_TERMS,
  aliases: VALS_ALIASES,
  fetch: () => valsRows(SLUG, { cost: null }),
};
export default board;
