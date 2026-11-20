// Dấu or Die: Vietnamese Diacritic Restoration (Kaggle Benchmarks, by tuanfelixnguyen): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column, a fraction shown here as a percentage.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'dau-or-die-vietnamese-diacritic-restoration',
  url: 'https://www.kaggle.com/benchmarks/tuanfelixnguyen/du-or-die-vietnamese-diacritic-restoration',
  feed: kaggleFeed('tuanfelixnguyen', 'du-or-die-vietnamese-diacritic-restoration'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('tuanfelixnguyen', 'du-or-die-vietnamese-diacritic-restoration', "(Overall)", 100),
};
export default board;
