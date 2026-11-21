// Tennis & Padel State Tracking Benchmark (Kaggle Benchmarks, by gulrezqayyum): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column, a fraction shown here as a percentage.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'tennis-padel-state-tracking-benchmark',
  url: 'https://www.kaggle.com/benchmarks/gulrezqayyum/tennis-and-padel-state-tracking-benchmark',
  feed: kaggleFeed('gulrezqayyum', 'tennis-and-padel-state-tracking-benchmark'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('gulrezqayyum', 'tennis-and-padel-state-tracking-benchmark', "(Overall)", 100),
};
export default board;
