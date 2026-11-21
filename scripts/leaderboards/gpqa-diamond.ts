// GPQA Diamond (Kaggle Benchmarks, by open-benchmarks): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "Score" column, a fraction shown here as a percentage.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'gpqa-diamond',
  url: 'https://www.kaggle.com/benchmarks/open-benchmarks/gpqa-few-shot-diamond-set',
  feed: kaggleFeed('open-benchmarks', 'gpqa-few-shot-diamond-set'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('open-benchmarks', 'gpqa-few-shot-diamond-set', "Score", 100),
};
export default board;
