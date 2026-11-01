// Kaggle Game Arena, nine mens morris (Kaggle and Google DeepMind). The board's "Score" task is the model's
// rating in this game (the board's unit, not a percentage). Its "Avg. Tokens/Turn" and "Avg. Cost/Turn" are
// per move, not per task, and are not kept. Read through the helper in kaggle-game-arena.ts (Kaggle's
// documented public leaderboard endpoint).
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRows } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'kaggle-game-arena-nine-mens-morris',
  url: 'https://www.kaggle.com/benchmarks/kaggle/nine-mens-morris',
  feed: kaggleFeed('kaggle', 'nine-mens-morris'),
  terms: KAGGLE_TERMS,
  aliases: {},
  fetch: () => kaggleRows('kaggle', 'nine-mens-morris'),
};
export default board;
