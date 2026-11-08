// Kaggle Game Arena, Go (Kaggle and Google DeepMind). The board's "Score" task is the model's rating in this
// game (the board's unit, not a percentage). Read through the helper in kaggle-game-arena.ts (Kaggle's
// documented public leaderboard endpoint). Its "Avg. Tokens/Turn" and "Avg. Cost/Turn" are per move, not per
// task, so they are kept as metrics.tokensPerTurn and costPerTurn (US dollars; the board shows cents), not as
// tokens and cost. The rating's confidence interval is kept as metrics.ciLow and ciHigh.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRows } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'kaggle-game-arena-go',
  url: 'https://www.kaggle.com/benchmarks/kaggle/go',
  feed: kaggleFeed('kaggle', 'go'),
  terms: KAGGLE_TERMS,
  aliases: {},
  fetch: () => kaggleRows('kaggle', 'go', 'Score', 1, { tokensPerTurn: { task: 'Avg. Tokens/Turn' }, costPerTurn: { task: 'Avg. Cost/Turn', scale: 0.01 } }),
};
export default board;
