// Cents Matter (Kaggle Benchmarks, by brunof94debug): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column, a fraction shown here as a percentage.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'cents-matter',
  url: 'https://www.kaggle.com/benchmarks/brunof94debug/cents-matter-centavos-importam',
  feed: kaggleFeed('brunof94debug', 'cents-matter-centavos-importam'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('brunof94debug', 'cents-matter-centavos-importam', "(Overall)", 100),
};
export default board;
