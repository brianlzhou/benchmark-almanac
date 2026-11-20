// Bio-PPI Risk: Serous vs Endometrioid (Kaggle Benchmarks, by nehaarora1509): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'bio-ppi-risk-serous-vs-endometrioid',
  url: 'https://www.kaggle.com/benchmarks/nehaarora1509/bio-ppi-risk-serous-vs-endometrioid',
  feed: kaggleFeed('nehaarora1509', 'bio-ppi-risk-serous-vs-endometrioid'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('nehaarora1509', 'bio-ppi-risk-serous-vs-endometrioid', "(Overall)", 1),
};
export default board;
