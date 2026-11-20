// Basic reasoning with letters (Kaggle Benchmarks, by navneetprabhat): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'basic-reasoning-with-letters',
  url: 'https://www.kaggle.com/benchmarks/navneetprabhat/basic-reasoning-with-letters',
  feed: kaggleFeed('navneetprabhat', 'basic-reasoning-with-letters'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('navneetprabhat', 'basic-reasoning-with-letters', "(Overall)", 1),
};
export default board;
