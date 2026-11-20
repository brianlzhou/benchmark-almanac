// Hype Trap (Kaggle Benchmarks, by saltysteve): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'hype-trap',
  url: 'https://www.kaggle.com/benchmarks/saltysteve/hype-trap',
  feed: kaggleFeed('saltysteve', 'hype-trap'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('saltysteve', 'hype-trap', "(Overall)", 1),
};
export default board;
