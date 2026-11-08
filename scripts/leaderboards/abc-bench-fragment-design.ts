// ABC-Bench fragment-design: the task family's published accuracy, in percent.
// Confidence intervals and refusal rates remain metrics on the whole-task row.
import type { Leaderboard } from './types.ts';
import { ABC_FEED, ABC_TERMS, ABC_ALIASES, abcRows } from '../lib/boards/securebio.ts';
const board: Leaderboard = {
  benchmark: 'abc-bench-fragment-design', url: ABC_FEED, feed: ABC_FEED,
  terms: ABC_TERMS, aliases: ABC_ALIASES,
  fetch: () => abcRows('fragment-design'),
};
export default board;
