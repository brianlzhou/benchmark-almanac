// VES Label Check (Kaggle Benchmarks, by danielnwaneri): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column, a fraction shown here as a percentage.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'ves-label-check',
  url: 'https://www.kaggle.com/benchmarks/danielnwaneri/ves-label-check',
  feed: kaggleFeed('danielnwaneri', 'ves-label-check'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('danielnwaneri', 'ves-label-check', "(Overall)", 100),
};
export default board;
