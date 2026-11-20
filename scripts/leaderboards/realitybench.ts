// realitybench (Kaggle Benchmarks, by neondev0): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'realitybench',
  url: 'https://www.kaggle.com/benchmarks/neondev0/realitybench',
  feed: kaggleFeed('neondev0', 'realitybench'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('neondev0', 'realitybench', "(Overall)", 1),
};
export default board;
