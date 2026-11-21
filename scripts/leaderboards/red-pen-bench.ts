// Red-Pen Bench (Kaggle Benchmarks, by robertgilbertusa): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'red-pen-bench',
  url: 'https://www.kaggle.com/benchmarks/robertgilbertusa/red-pen-bench',
  feed: kaggleFeed('robertgilbertusa', 'red-pen-bench'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('robertgilbertusa', 'red-pen-bench', "(Overall)", 1),
};
export default board;
