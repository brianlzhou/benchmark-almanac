// Passport Control (Kaggle Benchmarks, by thetraveller): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "Passport Control Read" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'passport-control',
  url: 'https://www.kaggle.com/benchmarks/thetraveller/passport-control',
  feed: kaggleFeed('thetraveller', 'passport-control'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('thetraveller', 'passport-control', "Passport Control Read", 1),
};
export default board;
