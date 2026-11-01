// FACTS Parametric v2 on Kaggle Benchmarks (Google DeepMind). The board's "Score" task, accuracy on closed-
// book factoid questions as a fraction, is the score (0 to 100); the private, public, attempted-accuracy, F1
// and hedging tasks are breakdowns. Read through the helper in kaggle-game-arena.ts (Kaggle's documented
// public leaderboard endpoint).
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRows } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'facts-parametric-v2',
  url: 'https://www.kaggle.com/benchmarks/google/facts-parametric',
  feed: kaggleFeed('google', 'facts-parametric'),
  terms: KAGGLE_TERMS,
  aliases: {},
  fetch: () => kaggleRows('google', 'facts-parametric', 'Score', 100),
};
export default board;
