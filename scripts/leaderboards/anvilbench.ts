// AnvilBench (Kaggle Benchmarks, by vikramtiwari): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'anvilbench',
  url: 'https://www.kaggle.com/benchmarks/vikramtiwari/anvilbench',
  feed: kaggleFeed('vikramtiwari', 'anvilbench'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('vikramtiwari', 'anvilbench', "(Overall)", 1),
};
export default board;
