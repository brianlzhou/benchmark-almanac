// Kaggle ASCII Arena (Kaggle Benchmarks, by kaggle): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "Arena" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'kaggle-ascii-arena',
  url: 'https://www.kaggle.com/benchmarks/kaggle/ascii-arena',
  feed: kaggleFeed('kaggle', 'ascii-arena'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('kaggle', 'ascii-arena', "Arena", 1),
};
export default board;
