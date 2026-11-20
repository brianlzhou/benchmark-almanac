// Dutch Book Bench (Kaggle Benchmarks, by yy5652): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column, a fraction shown here as a percentage.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'dutch-book-bench',
  url: 'https://www.kaggle.com/benchmarks/yy5652/dutch-book-bench',
  feed: kaggleFeed('yy5652', 'dutch-book-bench'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('yy5652', 'dutch-book-bench', "(Overall)", 100),
};
export default board;
