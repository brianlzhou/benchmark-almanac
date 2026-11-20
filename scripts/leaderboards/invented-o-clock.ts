// Invented O'Clock (Kaggle Benchmarks, by maddiebrooks208): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column, a fraction shown here as a percentage.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'invented-o-clock',
  url: 'https://www.kaggle.com/benchmarks/maddiebrooks208/invented-oclock',
  feed: kaggleFeed('maddiebrooks208', 'invented-oclock'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('maddiebrooks208', 'invented-oclock', "(Overall)", 100),
};
export default board;
