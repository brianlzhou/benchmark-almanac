// OpenBounds V2 Pilot (Kaggle Benchmarks, by albrechtl): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'openbounds-v2-pilot',
  url: 'https://www.kaggle.com/benchmarks/albrechtl/openbounds-v2-pilot',
  feed: kaggleFeed('albrechtl', 'openbounds-v2-pilot'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('albrechtl', 'openbounds-v2-pilot', "(Overall)", 1),
};
export default board;
