// Robots.txt Benchmark (Kaggle Benchmarks, by oldjard): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'robots-txt-benchmark',
  url: 'https://www.kaggle.com/benchmarks/oldjard/robots-txt-benchmark-can-llms-read-and-write-robo',
  feed: kaggleFeed('oldjard', 'robots-txt-benchmark-can-llms-read-and-write-robo'),
  terms: KAGGLE_TERMS,
  parts: {
    readRules: 'Read rules',
    readReal: 'Read real files',
    writePolicy: 'Write policy',
  },
  fetch: () => kaggleRowsWithBounds('oldjard', 'robots-txt-benchmark-can-llms-read-and-write-robo', "(Overall)", 1, {
    readRules: { task: 'robots_read_rules', interval: true },
    readReal: { task: 'robots_read_real', interval: true },
    writePolicy: { task: 'robots_write_policy', interval: true },
  }),
};
export default board;
