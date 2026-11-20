// pyATS-Bench (Kaggle Benchmarks, by nikshenoy): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'pyats-bench',
  url: 'https://www.kaggle.com/benchmarks/nikshenoy/pyats-bench',
  feed: kaggleFeed('nikshenoy', 'pyats-bench'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('nikshenoy', 'pyats-bench', "(Overall)", 1),
};
export default board;
