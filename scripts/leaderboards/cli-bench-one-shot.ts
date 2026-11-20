// CLI-Bench One-Shot (Kaggle Benchmarks, by aks1321): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'cli-bench-one-shot',
  url: 'https://www.kaggle.com/benchmarks/aks1321/cli-bench-one-shot',
  feed: kaggleFeed('aks1321', 'cli-bench-one-shot'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('aks1321', 'cli-bench-one-shot', "(Overall)", 1),
};
export default board;
