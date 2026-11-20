// Spatial Reasoning: Rotating ASCII Art (Kaggle Benchmarks, by neglectfulpersimmon): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'spatial-reasoning-rotating-ascii-art',
  url: 'https://www.kaggle.com/benchmarks/neglectfulpersimmon/spatial-reasoning-rotating-ascii-art',
  feed: kaggleFeed('neglectfulpersimmon', 'spatial-reasoning-rotating-ascii-art'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('neglectfulpersimmon', 'spatial-reasoning-rotating-ascii-art', "(Overall)", 1),
};
export default board;
