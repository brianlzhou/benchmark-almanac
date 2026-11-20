// RSNA Knee LLM Label Extraction (Kaggle Benchmarks, by kirderf): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'rsna-knee-llm-label-extraction',
  url: 'https://www.kaggle.com/benchmarks/kirderf/rsna-knee-llm-label-extraction-benchmark',
  feed: kaggleFeed('kirderf', 'rsna-knee-llm-label-extraction-benchmark'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('kirderf', 'rsna-knee-llm-label-extraction-benchmark', "(Overall)", 1),
};
export default board;
