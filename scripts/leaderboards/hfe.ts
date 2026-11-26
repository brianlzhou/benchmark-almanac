// Humanity's First Exam (Google DeepMind on Kaggle Benchmarks), read through Kaggle's documented public leaderboard
// endpoint with the helper in kaggle-game-arena.ts. The board's headline task is "Family pass^4": the share of the
// 136 four-prompt families where all 16 tries are correct, a fraction shown as a percentage, with its 95% interval.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRows } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'hfe',
  url: 'https://www.kaggle.com/benchmarks/deepmind/hfe',
  feed: kaggleFeed('deepmind', 'hfe'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRows('deepmind', 'hfe', 'Family pass^4', 100),
};
export default board;
