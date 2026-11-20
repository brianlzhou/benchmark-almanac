// Reasoning-Bias-Reporting-Quality (Kaggle Benchmarks, by gayathriarvind): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'reasoning-bias-reporting-quality',
  url: 'https://www.kaggle.com/benchmarks/gayathriarvind/reasoning-bias-reporting-quality',
  feed: kaggleFeed('gayathriarvind', 'reasoning-bias-reporting-quality'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('gayathriarvind', 'reasoning-bias-reporting-quality', "(Overall)", 1),
};
export default board;
