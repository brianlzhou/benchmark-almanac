// Vals CorpFin v2 (archived by Vals; its cost column is token prices, so no cost per task) on vals.ai, read through the helper in vals-index.ts.
import type { Leaderboard } from './types.ts';
import { VALS_ALIASES, VALS_TERMS, valsPage, valsRows } from './vals-index.ts';

const SLUG = 'corp_fin_v2';

const board: Leaderboard = {
  benchmark: 'corpfin-v2',
  url: valsPage(SLUG),
  feed: `${valsPage(SLUG)} (server-rendered leaderboard table)`,
  terms: VALS_TERMS,
  aliases: VALS_ALIASES,
  fetch: () => valsRows(SLUG, { cost: null }),
};
export default board;
