// Kaggle Game Arena, reversi (Kaggle and Google DeepMind). The board's "Score" task is the model's rating in
// this game (the board's unit, not a percentage). Its "Avg. Tokens/Turn" and "Avg. Cost/Turn" are per move,
// not per task, and remain tokensPerTurn and costPerTurn metrics. Read through the helper in kaggle-game-arena.ts (Kaggle's documented public
// leaderboard endpoint).
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRows } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'kaggle-game-arena-reversi',
  url: 'https://www.kaggle.com/benchmarks/kaggle/reversi',
  feed: kaggleFeed('kaggle', 'reversi'),
  terms: KAGGLE_TERMS,
  aliases: {},
  fetch: () => kaggleRows('kaggle', 'reversi', 'Score', 1, { tokensPerTurn: { task: 'Avg. Tokens/Turn' }, costPerTurn: { task: 'Avg. Cost/Turn' } }),
};
export default board;
