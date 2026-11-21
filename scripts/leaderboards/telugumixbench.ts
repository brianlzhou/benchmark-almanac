// TeluguMixBench (Kaggle Benchmarks, by poojithasaranya): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column, a fraction shown here as a percentage.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'telugumixbench',
  url: 'https://www.kaggle.com/benchmarks/poojithasaranya/telugumixbench',
  feed: kaggleFeed('poojithasaranya', 'telugumixbench'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('poojithasaranya', 'telugumixbench', "(Overall)", 100),
};
export default board;
