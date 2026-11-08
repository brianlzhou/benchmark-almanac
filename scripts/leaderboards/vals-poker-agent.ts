// Vals Poker Agent (headline TrueSkill rating, not a percentage) on vals.ai, read through the helper in vals-index.ts.
import type { Leaderboard } from './types.ts';
import { VALS_ALIASES, VALS_TERMS, valsPage, valsRows } from './vals-index.ts';

const SLUG = 'poker_agent';

const board: Leaderboard = {
  benchmark: 'vals-poker-agent',
  url: valsPage(SLUG),
  feed: `${valsPage(SLUG)} (server-rendered leaderboard table)`,
  terms: VALS_TERMS,
  aliases: VALS_ALIASES,
  fetch: () => valsRows(SLUG, { score: 'TrueSkill Rating', cost: 'Cost / Hand' }),
};
export default board;
