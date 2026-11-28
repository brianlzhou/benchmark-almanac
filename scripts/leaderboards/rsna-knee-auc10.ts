// RSNA Knee AUC10 (Kaggle Benchmarks, by kirderf): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'rsna-knee-auc10',
  url: 'https://www.kaggle.com/benchmarks/kirderf/rsna-knee-llm-label-extraction-benchmark-auc10',
  feed: kaggleFeed('kirderf', 'rsna-knee-llm-label-extraction-benchmark-auc10'),
  terms: KAGGLE_TERMS,
  parts: {
    visionSmall: 'Vision small',
    visionMedium: 'Vision medium',
    visionLarge: 'Vision large',
    visionRawSmall: 'Vision and raw report small',
    visionRawMedium: 'Vision and raw report medium',
    visionRawLarge: 'Vision and raw report large',
    rawReport: 'Raw report',
  },
  fetch: () => kaggleRowsWithBounds('kirderf', 'rsna-knee-llm-label-extraction-benchmark-auc10', "(Overall)", 1, {
    visionSmall: { task: 'knee_vision_auc10_small' },
    visionMedium: { task: 'knee_vision_auc10_medium' },
    visionLarge: { task: 'knee_vision_auc10_large' },
    visionRawSmall: { task: 'knee_visionraw_auc10_small' },
    visionRawMedium: { task: 'knee_visionraw_auc10_medium' },
    visionRawLarge: { task: 'knee_visionraw_auc10_large' },
    rawReport: { task: 'knee_rawrep_auc10' },
  }),
};
export default board;
