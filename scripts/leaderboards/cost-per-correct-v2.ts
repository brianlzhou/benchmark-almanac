// Cost Per Correct v2 (Kaggle Benchmarks, by karmendra8386): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'cost-per-correct-v2',
  url: 'https://www.kaggle.com/benchmarks/karmendra8386/cost-per-correct-v2',
  feed: kaggleFeed('karmendra8386', 'cost-per-correct-v2'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('karmendra8386', 'cost-per-correct-v2', "(Overall)", 1),
};
export default board;
