// Keep the number you wrote (Kaggle Benchmarks, by vinimabreu): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'keep-the-number-you-wrote',
  url: 'https://www.kaggle.com/benchmarks/vinimabreu/keep-the-number-you-wrote',
  feed: kaggleFeed('vinimabreu', 'keep-the-number-you-wrote'),
  terms: KAGGLE_TERMS,
  parts: {
    digits: 'Numeric format',
    unitsSpelledOut: 'Units spelled out',
  },
  fetch: () => kaggleRowsWithBounds('vinimabreu', 'keep-the-number-you-wrote', "(Overall)", 1, {
    digits: { task: 'keep_the_number_you_wrote', interval: true },
    unitsSpelledOut: { task: 'keep_the_number_units_spelled_out', interval: true },
  }),
};
export default board;
