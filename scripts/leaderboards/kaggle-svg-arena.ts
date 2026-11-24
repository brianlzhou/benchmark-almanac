// Kaggle SVG Arena (Kaggle Benchmarks, by kaggle): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "Arena" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'kaggle-svg-arena',
  url: 'https://www.kaggle.com/benchmarks/kaggle/svg-arena',
  feed: kaggleFeed('kaggle', 'svg-arena'),
  terms: KAGGLE_TERMS,
  stats: { votes: { name: 'Votes', unit: 'count' } },
  fetch: () => kaggleRowsWithBounds('kaggle', 'svg-arena', "Arena", 1, { votes: { task: 'Votes' } }),
};
export default board;
