// Safety-Scene Vision Benchmark (Kaggle Benchmarks, by clivinjohn): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'safety-scene-vision-benchmark',
  url: 'https://www.kaggle.com/benchmarks/clivinjohn/safety-scene-vision-benchmark',
  feed: kaggleFeed('clivinjohn', 'safety-scene-vision-benchmark'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('clivinjohn', 'safety-scene-vision-benchmark', "(Overall)", 1),
};
export default board;
