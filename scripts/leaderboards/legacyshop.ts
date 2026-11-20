// LegacyShop (Kaggle Benchmarks, by iseoluwaolowogoke): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'legacyshop',
  url: 'https://www.kaggle.com/benchmarks/iseoluwaolowogoke/legacyshop-can-an-ai-maintain-a-real-codebase',
  feed: kaggleFeed('iseoluwaolowogoke', 'legacyshop-can-an-ai-maintain-a-real-codebase'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('iseoluwaolowogoke', 'legacyshop-can-an-ai-maintain-a-real-codebase', "(Overall)", 1),
};
export default board;
