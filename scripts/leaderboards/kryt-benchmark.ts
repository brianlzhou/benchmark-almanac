// KRYT Benchmark (Kaggle Benchmarks, by vaibhavlalwani21): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'kryt-benchmark',
  url: 'https://www.kaggle.com/benchmarks/vaibhavlalwani21/kryt-benchmark',
  feed: kaggleFeed('vaibhavlalwani21', 'kryt-benchmark'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('vaibhavlalwani21', 'kryt-benchmark', "(Overall)", 1),
};
export default board;
