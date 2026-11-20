// NAFD E1 Financial Reporting (Kaggle Benchmarks, by nelsonvikou): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'nafd-e1-financial-reporting',
  url: 'https://www.kaggle.com/benchmarks/nelsonvikou/nafd-e1-financial-reporting',
  feed: kaggleFeed('nelsonvikou', 'nafd-e1-financial-reporting'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('nelsonvikou', 'nafd-e1-financial-reporting', "(Overall)", 1),
};
export default board;
