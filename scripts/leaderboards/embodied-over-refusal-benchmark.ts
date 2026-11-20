// Embodied Over-Refusal Benchmark (Kaggle Benchmarks, by goth55): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'embodied-over-refusal-benchmark',
  url: 'https://www.kaggle.com/benchmarks/goth55/embodied-over-refusal-benchmark',
  feed: kaggleFeed('goth55', 'embodied-over-refusal-benchmark'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('goth55', 'embodied-over-refusal-benchmark', "(Overall)", 1),
};
export default board;
