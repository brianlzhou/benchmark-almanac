// Lakh, Crore and Carpet Area (Kaggle Benchmarks, by reet22): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column, a fraction shown here as a percentage.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'lakh-crore-and-carpet-area',
  url: 'https://www.kaggle.com/benchmarks/reet22/lakh-crore-and-carpet-area',
  feed: kaggleFeed('reet22', 'lakh-crore-and-carpet-area'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('reet22', 'lakh-crore-and-carpet-area', "(Overall)", 100),
};
export default board;
