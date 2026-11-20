// Robots.txt Benchmark (Kaggle Benchmarks, by oldjard): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'robots-txt-benchmark',
  url: 'https://www.kaggle.com/benchmarks/oldjard/robots-txt-benchmark-can-llms-read-and-write-robo',
  feed: kaggleFeed('oldjard', 'robots-txt-benchmark-can-llms-read-and-write-robo'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('oldjard', 'robots-txt-benchmark-can-llms-read-and-write-robo', "(Overall)", 1),
};
export default board;
