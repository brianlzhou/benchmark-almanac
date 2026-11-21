// ModelBench: Reliability Under Constraints (Kaggle Benchmarks, by ezeprincejr): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "modelbench_reliability" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'modelbench-reliability-under-constraints',
  url: 'https://www.kaggle.com/benchmarks/ezeprincejr/modelbench-reliability-under-constraints',
  feed: kaggleFeed('ezeprincejr', 'modelbench-reliability-under-constraints'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('ezeprincejr', 'modelbench-reliability-under-constraints', "modelbench_reliability", 1),
};
export default board;
