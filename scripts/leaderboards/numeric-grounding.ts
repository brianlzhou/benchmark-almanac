// Numeric Grounding (Kaggle Benchmarks, by alanfinney): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'numeric-grounding',
  url: 'https://www.kaggle.com/benchmarks/alanfinney/numeric-grounding',
  feed: kaggleFeed('alanfinney', 'numeric-grounding'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('alanfinney', 'numeric-grounding', "(Overall)", 1),
};
export default board;
