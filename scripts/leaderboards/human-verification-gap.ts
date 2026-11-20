// Human Verification Gap (Kaggle Benchmarks, by hersheyz): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'human-verification-gap',
  url: 'https://www.kaggle.com/benchmarks/hersheyz/human-verification-gap',
  feed: kaggleFeed('hersheyz', 'human-verification-gap'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('hersheyz', 'human-verification-gap', "(Overall)", 1),
};
export default board;
