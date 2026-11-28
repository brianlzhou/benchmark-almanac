// Animated Story Arena on Kaggle Benchmarks (kaggle), read through Kaggle's documented public leaderboard endpoint with the
// helper in kaggle-game-arena.ts. The board's "Arena" task is the score.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRows } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'kaggle-animated-story-arena',
  url: 'https://www.kaggle.com/benchmarks/kaggle/animated-story-arena',
  feed: kaggleFeed('kaggle', 'animated-story-arena'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRows('kaggle', 'animated-story-arena', "Arena", 1),
};
export default board;
