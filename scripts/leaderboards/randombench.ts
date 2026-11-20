// RandomBench (Kaggle Benchmarks, by benjaminbrumfield): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "RandomBench Last Digit" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'randombench',
  url: 'https://www.kaggle.com/benchmarks/benjaminbrumfield/randombench',
  feed: kaggleFeed('benjaminbrumfield', 'randombench'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('benjaminbrumfield', 'randombench', "RandomBench Last Digit", 1),
};
export default board;
