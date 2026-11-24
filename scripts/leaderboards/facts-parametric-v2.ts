// FACTS Parametric v2 on Kaggle Benchmarks (Google DeepMind). The board's "Score" task, accuracy on closed-
// book factoid questions as a fraction, is the score (0 to 100); the private, public, attempted-accuracy, F1
// and hedging tasks are breakdowns. Read through the helper in kaggle-game-arena.ts (Kaggle's documented
// public leaderboard endpoint).
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRows } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'facts-parametric-v2',
  parts: {
    public: { name: 'Public', group: 'Split' },
    private: { name: 'Private', group: 'Split' },
  },
  stats: {
    attempted: { name: 'Attempted accuracy', unit: '%', better: 'higher' },
    f1: { name: 'F1', unit: '%', better: 'higher' },
    hedging: { name: 'Hedging rate', unit: '%', better: 'lower' },
  },
  url: 'https://www.kaggle.com/benchmarks/google/facts-parametric',
  feed: kaggleFeed('google', 'facts-parametric'),
  terms: KAGGLE_TERMS,
  aliases: {},
  fetch: () => kaggleRows('google', 'facts-parametric', 'Score', 100, {
    public: { task: 'Public Score', scale: 100, interval: true },
    private: { task: 'Private Score', scale: 100, interval: true },
    attempted: { task: 'Attempted Accuracy', scale: 100 },
    f1: { task: 'F1 Score', scale: 100 },
    hedging: { task: 'Hedging Rate', scale: 100 },
  }),
};
export default board;
