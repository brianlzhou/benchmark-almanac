// Deterministic Agent Reasoning & Formatting Suite (Kaggle Benchmarks, by wenimohamed): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'deterministic-agent-reasoning-formatting-suite',
  url: 'https://www.kaggle.com/benchmarks/wenimohamed/deterministic-agent-reasoning-and-formatting-suite',
  feed: kaggleFeed('wenimohamed', 'deterministic-agent-reasoning-and-formatting-suite'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('wenimohamed', 'deterministic-agent-reasoning-and-formatting-suite', "(Overall)", 1),
};
export default board;
