// Gulf Text-to-SQL Bench (Kaggle Benchmarks, by usmanahmad): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column, a fraction shown here as a percentage.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'gulf-text-to-sql-bench',
  url: 'https://www.kaggle.com/benchmarks/usmanahmad/gulf-text-to-sql-bench',
  feed: kaggleFeed('usmanahmad', 'gulf-text-to-sql-bench'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('usmanahmad', 'gulf-text-to-sql-bench', "(Overall)", 100),
};
export default board;
