// RLBench (Interactive Learning) on Kaggle Benchmarks (kdcyberdude), read through Kaggle's documented public leaderboard endpoint with the
// helper in kaggle-game-arena.ts. The board's "(Overall)" task is the score.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRows } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'rlbench-interactive-learning',
  url: 'https://www.kaggle.com/benchmarks/kdcyberdude/rlbench',
  feed: kaggleFeed('kdcyberdude', 'rlbench'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRows('kdcyberdude', 'rlbench', "(Overall)", 1),
};
export default board;
