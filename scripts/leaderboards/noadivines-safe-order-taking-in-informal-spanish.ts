// NoAdivines: Safe Order-Taking in Informal Spanish (Kaggle Benchmarks, by henrysrdz): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'noadivines-safe-order-taking-in-informal-spanish',
  url: 'https://www.kaggle.com/benchmarks/henrysrdz/noadivines-safe-order-taking-in-informal-spanish',
  feed: kaggleFeed('henrysrdz', 'noadivines-safe-order-taking-in-informal-spanish'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('henrysrdz', 'noadivines-safe-order-taking-in-informal-spanish', "(Overall)", 1),
};
export default board;
