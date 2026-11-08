// ABC-Bench liquid-handling-robot: the task family's published accuracy, in percent.
// Confidence intervals and refusal rates remain metrics on the whole-task row.
import type { Leaderboard } from './types.ts';
import { ABC_FEED, ABC_TERMS, ABC_ALIASES, abcRows } from '../lib/boards/securebio.ts';
const board: Leaderboard = {
  benchmark: 'abc-bench-liquid-handling-robot', url: ABC_FEED, feed: ABC_FEED,
  terms: ABC_TERMS, aliases: ABC_ALIASES,
  fetch: () => abcRows('liquid-handling-robot'),
};
export default board;
