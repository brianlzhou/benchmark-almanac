// Kaggle Game Arena, dark hex (Kaggle and Google DeepMind). The board's "Score" task is the model's rating in
// this game (the board's unit, not a percentage). Its "Avg. Tokens/Turn" and "Avg. Cost/Turn" are per move,
// not per task, and are retained as separate metrics. Read through the helper in kaggle-game-arena.ts (Kaggle's documented public
// leaderboard endpoint).
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRows } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'kaggle-game-arena-dark-hex',
  url: 'https://www.kaggle.com/benchmarks/kaggle/dark-hex',
  feed: kaggleFeed('kaggle', 'dark-hex'),
  terms: KAGGLE_TERMS,
  aliases: {},
  fetch: () => kaggleRows('kaggle', 'dark-hex', 'Score', 1, { tokensPerTurn:{task:'Avg. Tokens/Turn'}, costPerTurn:{task:'Avg. Cost/Turn'} }),
};
export default board;
