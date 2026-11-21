// Resolve (Kaggle Benchmarks, by puriadityakumar): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column, a fraction shown here as a percentage.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'resolve',
  url: 'https://www.kaggle.com/benchmarks/puriadityakumar/resolve',
  feed: kaggleFeed('puriadityakumar', 'resolve'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('puriadityakumar', 'resolve', "(Overall)", 100),
};
export default board;
