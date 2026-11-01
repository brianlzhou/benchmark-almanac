// FrontierCS 2 on Kaggle Benchmarks, read through the helper in kaggle-game-arena.ts (Kaggle's documented
// public leaderboard endpoint). The board's "Score" task is the share of the 48 released tasks solved,
// already on a 0 to 100 scale; the other tasks are the per-problem results.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRows } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'frontiercs-2',
  url: 'https://www.kaggle.com/benchmarks/frontiercs/frontiercs-2',
  feed: kaggleFeed('frontiercs', 'frontiercs-2'),
  terms: KAGGLE_TERMS,
  aliases: {
    'Muse Wonder 1.0': 'muse-wonder',
  },
  fetch: () => kaggleRows('frontiercs', 'frontiercs-2'),
};
export default board;
