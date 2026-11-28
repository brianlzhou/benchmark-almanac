// SOCRATES (Social Cognition) on Kaggle Benchmarks (alfaxadeyembe), read through Kaggle's documented public leaderboard endpoint with the
// helper in kaggle-game-arena.ts. The board's "(Overall)" task is the score.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRows } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'socrates-social-cognition',
  url: 'https://www.kaggle.com/benchmarks/alfaxadeyembe/socrates',
  feed: kaggleFeed('alfaxadeyembe', 'socrates'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRows('alfaxadeyembe', 'socrates', "(Overall)", 1),
};
export default board;
