// CPU Inference Optimization and Streaming (Kaggle Benchmarks, by jiantaoo): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'cpu-inference-optimization-and-streaming',
  url: 'https://www.kaggle.com/benchmarks/jiantaoo/cpu-inference-optimization-and-streaming',
  feed: kaggleFeed('jiantaoo', 'cpu-inference-optimization-and-streaming'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('jiantaoo', 'cpu-inference-optimization-and-streaming', "(Overall)", 1),
};
export default board;
