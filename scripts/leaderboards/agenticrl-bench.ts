// AgenticRL-Bench (Kaggle Benchmarks, by eigent): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "Pass rate" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'agenticrl-bench',
  url: 'https://www.kaggle.com/benchmarks/eigent/agenticrl-bench',
  feed: kaggleFeed('eigent', 'agenticrl-bench'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('eigent', 'agenticrl-bench', "Pass rate", 1),
};
export default board;
