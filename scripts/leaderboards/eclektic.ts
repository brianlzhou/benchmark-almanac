// ECLeKTic on Kaggle Benchmarks (Google). The "Score" task, the share of questions answered correctly in both
// the source language and the target language (a fraction, shown 0 to 100), is the score. "Transfer Score" is a
// breakdown. Read through the helper in kaggle-game-arena.ts.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRows } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'eclektic',
  url: 'https://www.kaggle.com/benchmarks/google/eclektic',
  feed: kaggleFeed('google', 'eclektic'),
  terms: KAGGLE_TERMS,
  aliases: {},
  fetch: () => kaggleRows('google', 'eclektic', 'Score', 100),
};
export default board;
