// Aviation Blind Spot Benchmark (Kaggle Benchmarks, by gastondana): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column, a fraction shown here as a percentage.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'aviation-blind-spot-benchmark',
  url: 'https://www.kaggle.com/benchmarks/gastondana/aviation-blind-spot-benchmark',
  feed: kaggleFeed('gastondana', 'aviation-blind-spot-benchmark'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('gastondana', 'aviation-blind-spot-benchmark', "(Overall)", 100),
};
export default board;
