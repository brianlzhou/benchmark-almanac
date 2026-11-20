// Memory Discipline (Kaggle Benchmarks, by giulioder): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column, a fraction shown here as a percentage.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'memory-discipline',
  url: 'https://www.kaggle.com/benchmarks/giulioder/memory-discipline',
  feed: kaggleFeed('giulioder', 'memory-discipline'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('giulioder', 'memory-discipline', "(Overall)", 100),
};
export default board;
