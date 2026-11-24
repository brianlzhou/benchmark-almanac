// ECLeKTic on Kaggle Benchmarks (Google). The "Score" task, the share of questions answered correctly in both
// the source language and the target language (a fraction, shown 0 to 100), is the score. "Transfer Score" measures transfer conditional on a correct source answer.
// Keep both measures and their confidence intervals.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'eclektic',
  url: 'https://www.kaggle.com/benchmarks/google/eclektic',
  feed: kaggleFeed('google', 'eclektic'),
  terms: KAGGLE_TERMS,
  aliases: {},
  stats: {
    transferScore: { name: 'Transfer score', unit: '%', better: 'higher' },
  },
  fetch: () => kaggleRowsWithBounds('google', 'eclektic', 'Score', 100, {
    transferScore: { task: 'Transfer Score', scale: 100, interval: true },
  }),
};
export default board;
