// Testing model's emotional inteligence (Kaggle Benchmarks, by aryankumarakj): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'testing-model-s-emotional-inteligence',
  url: 'https://www.kaggle.com/benchmarks/aryankumarakj/testing-models-emotional-inteligence',
  feed: kaggleFeed('aryankumarakj', 'testing-models-emotional-inteligence'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('aryankumarakj', 'testing-models-emotional-inteligence', "(Overall)", 1),
};
export default board;
