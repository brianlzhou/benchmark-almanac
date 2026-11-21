// Reasoning Dial (Kaggle Benchmarks, by abeeralodhi): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column, a fraction shown here as a percentage.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'reasoning-dial',
  url: 'https://www.kaggle.com/benchmarks/abeeralodhi/reasoning-dial',
  feed: kaggleFeed('abeeralodhi', 'reasoning-dial'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('abeeralodhi', 'reasoning-dial', "(Overall)", 100),
};
export default board;
