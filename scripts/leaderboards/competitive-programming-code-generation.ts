// Competitive Programming Code Generation (Kaggle Benchmarks, by aminemontasir): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column, a fraction shown here as a percentage.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'competitive-programming-code-generation',
  url: 'https://www.kaggle.com/benchmarks/aminemontasir/competitive-programming-code-generation',
  feed: kaggleFeed('aminemontasir', 'competitive-programming-code-generation'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('aminemontasir', 'competitive-programming-code-generation', "(Overall)", 100),
};
export default board;
