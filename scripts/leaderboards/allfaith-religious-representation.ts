// AllFaith Religious Representation on Kaggle Benchmarks (cefe-ai), read through Kaggle's documented public leaderboard endpoint with the
// helper in kaggle-game-arena.ts. The board's "Religious Representation" task is the score.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRows } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'allfaith-religious-representation',
  url: 'https://www.kaggle.com/benchmarks/cefe-ai/allfaith-religious-representation',
  feed: kaggleFeed('cefe-ai', 'allfaith-religious-representation'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRows('cefe-ai', 'allfaith-religious-representation', "Religious Representation", 1),
};
export default board;
