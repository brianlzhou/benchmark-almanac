// Keep the number you wrote (Kaggle Benchmarks, by vinimabreu): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'keep-the-number-you-wrote',
  url: 'https://www.kaggle.com/benchmarks/vinimabreu/keep-the-number-you-wrote',
  feed: kaggleFeed('vinimabreu', 'keep-the-number-you-wrote'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('vinimabreu', 'keep-the-number-you-wrote', "(Overall)", 1),
};
export default board;
