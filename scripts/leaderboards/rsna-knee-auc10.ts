// RSNA Knee AUC10 (Kaggle Benchmarks, by kirderf): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'rsna-knee-auc10',
  url: 'https://www.kaggle.com/benchmarks/kirderf/rsna-knee-llm-label-extraction-benchmark-auc10',
  feed: kaggleFeed('kirderf', 'rsna-knee-llm-label-extraction-benchmark-auc10'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('kirderf', 'rsna-knee-llm-label-extraction-benchmark-auc10', "(Overall)", 1),
};
export default board;
