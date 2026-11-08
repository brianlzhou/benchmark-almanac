// Kaggle Game Arena, four in a row (Kaggle and Google DeepMind). The board's "Score" task is the model's rating in
// this game (the board's unit, not a percentage). Its "Avg. Tokens/Turn" is kept as metrics.tokensPerTurn (per
// move, not per task); "Avg. Cost/Turn" is a reportedCostPerTurn metric in the source unit, not task cost. Read through the
// helper in kaggle-game-arena.ts (Kaggle's documented public leaderboard endpoint).
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRows } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'kaggle-game-arena-four-in-a-row',
  url: 'https://www.kaggle.com/benchmarks/kaggle/four-in-a-row',
  feed: kaggleFeed('kaggle', 'four-in-a-row'),
  terms: KAGGLE_TERMS,
  aliases: {},
  fetch: () => kaggleRows('kaggle', 'four-in-a-row', 'Score', 1, { tokensPerTurn: { task: 'Avg. Tokens/Turn' }, reportedCostPerTurn: { task: 'Avg. Cost/Turn' } }),
};
export default board;
