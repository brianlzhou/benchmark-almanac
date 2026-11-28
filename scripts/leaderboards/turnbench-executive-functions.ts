// TurnBench (Executive Functions) on Kaggle Benchmarks (zxsimon2), read through Kaggle's documented public leaderboard endpoint with the
// helper in kaggle-game-arena.ts. The board's "(Overall)" task is the score.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRows } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'turnbench-executive-functions',
  url: 'https://www.kaggle.com/benchmarks/zxsimon2/turnbench',
  feed: kaggleFeed('zxsimon2', 'turnbench'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRows('zxsimon2', 'turnbench', "(Overall)", 1),
};
export default board;
