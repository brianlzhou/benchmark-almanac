// Judge Bait (Kaggle Benchmarks, by kelechukwuagbo): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column, a fraction shown here as a percentage.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'judge-bait',
  url: 'https://www.kaggle.com/benchmarks/kelechukwuagbo/judge-bait',
  feed: kaggleFeed('kelechukwuagbo', 'judge-bait'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('kelechukwuagbo', 'judge-bait', "(Overall)", 100),
};
export default board;
