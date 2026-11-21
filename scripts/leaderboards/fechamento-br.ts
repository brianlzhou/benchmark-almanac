// Fechamento BR (Kaggle Benchmarks, by lawliet8886): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'fechamento-br',
  url: 'https://www.kaggle.com/benchmarks/lawliet8886/fechamento-br-same-score-different-failure',
  feed: kaggleFeed('lawliet8886', 'fechamento-br-same-score-different-failure'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('lawliet8886', 'fechamento-br-same-score-different-failure', "(Overall)", 1),
};
export default board;
