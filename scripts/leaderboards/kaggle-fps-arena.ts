// Kaggle FPS Arena (Kaggle Benchmarks, by kaggle): read through the helper in kaggle-game-arena.ts,
// Kaggle's documented public leaderboard endpoint. The headline is the board's "Arena" column, with its
// confidence interval kept as low/high bounds and "Votes" kept as a stat.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'kaggle-fps-arena',
  url: 'https://www.kaggle.com/benchmarks/kaggle/fps-arena',
  feed: kaggleFeed('kaggle', 'fps-arena'),
  terms: KAGGLE_TERMS,
  stats: { votes: { name: 'Votes', unit: 'count' } },
  fetch: () => kaggleRowsWithBounds('kaggle', 'fps-arena', 'Arena', 1, { votes: { task: 'Votes' } }),
};
export default board;
