// Business Evidence Judgment v4 (Kaggle Benchmarks, by wangfuguang): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column, a fraction shown here as a percentage.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'business-evidence-judgment-v4',
  url: 'https://www.kaggle.com/benchmarks/wangfuguang/business-evidence-judgment-v4',
  feed: kaggleFeed('wangfuguang', 'business-evidence-judgment-v4'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('wangfuguang', 'business-evidence-judgment-v4', "(Overall)", 100),
};
export default board;
