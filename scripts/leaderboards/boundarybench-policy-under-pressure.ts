// BoundaryBench: Policy Under Pressure (Kaggle Benchmarks, by aryakoste): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column, a fraction shown here as a percentage.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'boundarybench-policy-under-pressure',
  url: 'https://www.kaggle.com/benchmarks/aryakoste/boundarybench-policy-under-pressure',
  feed: kaggleFeed('aryakoste', 'boundarybench-policy-under-pressure'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('aryakoste', 'boundarybench-policy-under-pressure', "(Overall)", 100),
};
export default board;
