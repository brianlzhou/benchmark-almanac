// FailureSensorIQ on Kaggle Benchmarks (IBM Research). The board sits at ibm-research/asset-ops-bench but its
// tasks (Selection, Elimination and perturbed accuracy, Consistency) are FailureSensorIQ's multiple-choice
// questions, not the AssetOpsBench agent tasks. The "Score" task, a fraction, is the score (0 to 100). Read
// through the helper in kaggle-game-arena.ts.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRows } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'failuresensoriq',
  url: 'https://www.kaggle.com/benchmarks/ibm-research/asset-ops-bench',
  feed: kaggleFeed('ibm-research', 'asset-ops-bench'),
  terms: KAGGLE_TERMS,
  aliases: {},
  fetch: () => kaggleRows('ibm-research', 'asset-ops-bench', 'Score', 100),
};
export default board;
