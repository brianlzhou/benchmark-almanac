// Judge Bait (Kaggle Benchmarks, by kelechukwuagbo): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column, a fraction shown here as a percentage.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'judge-bait',
  url: 'https://www.kaggle.com/benchmarks/kelechukwuagbo/judge-bait',
  feed: kaggleFeed('kelechukwuagbo', 'judge-bait'),
  terms: KAGGLE_TERMS,
  parts: {
    baseline: 'Baseline',
    verbosity: 'Verbosity',
    pressure: 'Pressure',
    authority: 'Authority',
    injection: 'Injection',
  },
  fetch: () => kaggleRowsWithBounds('kelechukwuagbo', 'judge-bait', "(Overall)", 100, {
    baseline: { task: 'Judge Bait: Baseline', scale: 100, interval: true },
    verbosity: { task: 'Judge Bait: Verbosity', scale: 100, interval: true },
    pressure: { task: 'Judge Bait: Pressure', scale: 100, interval: true },
    authority: { task: 'Judge Bait: Authority', scale: 100, interval: true },
    injection: { task: 'Judge Bait: Injection', scale: 100, interval: true },
  }),
};
export default board;
