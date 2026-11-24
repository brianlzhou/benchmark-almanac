// FailureSensorIQ on Kaggle Benchmarks (IBM Research). The board sits at ibm-research/asset-ops-bench but its
// tasks (Selection, Elimination and perturbed accuracy, Consistency) are FailureSensorIQ's multiple-choice
// questions, not the AssetOpsBench agent tasks. The "Score" task, a fraction, is the score (0 to 100). Read
// through the helper in kaggle-game-arena.ts.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'failuresensoriq',
  parts: {
    selection: 'Selection accuracy',
    elimination: 'Elimination accuracy',
    pertSimple: 'Perturbed simple accuracy',
    pertComplex: 'Perturbed complex accuracy',
  },
  stats: {
    consistency: { name: 'Consistency', unit: '%', better: 'higher' },
    fScore: { name: 'F-score', unit: '%', better: 'higher' },
  },
  url: 'https://www.kaggle.com/benchmarks/ibm-research/asset-ops-bench',
  feed: kaggleFeed('ibm-research', 'asset-ops-bench'),
  terms: KAGGLE_TERMS,
  aliases: {},
  fetch: () => kaggleRowsWithBounds('ibm-research', 'asset-ops-bench', 'Score', 100, {
    selection: { task: 'Selection Accuracy', scale: 100 },
    elimination: { task: 'Elimination Accuracy', scale: 100 },
    pertSimple: { task: 'Pert. Simple Accuracy', scale: 100 },
    pertComplex: { task: 'Pert. Complex Accuracy', scale: 100 },
    consistency: { task: 'Consistency', scale: 100 },
    fScore: { task: 'F-Score', scale: 100 },
  }),
};
export default board;
