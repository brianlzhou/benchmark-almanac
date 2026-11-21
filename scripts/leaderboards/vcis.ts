// VCIS (Kaggle Benchmarks, by fahmiagungmaulana): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column, a fraction shown here as a percentage.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'vcis',
  url: 'https://www.kaggle.com/benchmarks/fahmiagungmaulana/vcis',
  feed: kaggleFeed('fahmiagungmaulana', 'vcis'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('fahmiagungmaulana', 'vcis', "(Overall)", 100),
};
export default board;
