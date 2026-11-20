// Turn based Benchmarks (Kaggle Benchmarks, by mikaelaldy): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'turn-based-benchmarks',
  url: 'https://www.kaggle.com/benchmarks/mikaelaldy/turn-based-benchmarks',
  feed: kaggleFeed('mikaelaldy', 'turn-based-benchmarks'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('mikaelaldy', 'turn-based-benchmarks', "(Overall)", 1),
};
export default board;
