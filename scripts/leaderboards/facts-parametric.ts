// FACTS Parametric (the first version) on Kaggle Benchmarks (Google DeepMind). Kaggle keeps each board version at
// versions/<n>. Version 1 is this record and version 2 (published 2026-10-27) is facts-parametric-v2. The
// "Score" task, a fraction, is the score (0 to 100). Read through the helper in kaggle-game-arena.ts.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRows } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'facts-parametric',
  parts: {
    public: { name: 'Public', group: 'Split' },
    private: { name: 'Private', group: 'Split' },
  },
  stats: {
    attempted: { name: 'Attempted accuracy', unit: '%', better: 'higher' },
    f1: { name: 'F1', unit: '%', better: 'higher' },
    hedging: { name: 'Hedging rate', unit: '%', better: 'lower' },
  },
  url: 'https://www.kaggle.com/benchmarks/google/facts-parametric/versions/1',
  feed: kaggleFeed('google', 'facts-parametric/versions/1'),
  terms: KAGGLE_TERMS,
  aliases: {},
  fetch: () => kaggleRows('google', 'facts-parametric/versions/1', 'Score', 100, {
    public: { task: 'Public Score', scale: 100, interval: true },
    private: { task: 'Private Score', scale: 100, interval: true },
    attempted: { task: 'Attempted Accuracy', scale: 100 },
    f1: { task: 'F1 Score', scale: 100 },
    hedging: { task: 'Hedging Rate', scale: 100 },
  }),
};
export default board;
