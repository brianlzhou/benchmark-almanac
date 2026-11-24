// Kaggle Sort Viz Arena (Kaggle Benchmarks, by kaggle): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "Arena" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'kaggle-sort-viz-arena',
  url: 'https://www.kaggle.com/benchmarks/kaggle/sort-viz-arena',
  feed: kaggleFeed('kaggle', 'sort-viz-arena'),
  terms: KAGGLE_TERMS,
  stats: { votes: { name: 'Votes', unit: 'count' } },
  fetch: () => kaggleRowsWithBounds('kaggle', 'sort-viz-arena', "Arena", 1, { votes: { task: 'Votes' } }),
};
export default board;
