// Kaggle Game Arena, lines of action (Kaggle and Google DeepMind). The board's "Score" task is the model's
// rating in this game (the board's unit, not a percentage). Its "Avg. Tokens/Turn" and "Avg. Cost/Turn" are
// per move, not per task, and are retained as source-unit metrics. Read through the helper in kaggle-game-arena.ts (Kaggle's
// documented public leaderboard endpoint).
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRows } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'kaggle-game-arena-lines-of-action',
  url: 'https://www.kaggle.com/benchmarks/kaggle/lines-of-action',
  feed: kaggleFeed('kaggle', 'lines-of-action'),
  terms: KAGGLE_TERMS,
  aliases: {},
  fetch: () => kaggleRows('kaggle', 'lines-of-action', 'Score', 1, { tokensPerTurn: { task: 'Avg. Tokens/Turn' }, reportedCostPerTurn: { task: 'Avg. Cost/Turn' } }),
};
export default board;
