// Kaggle Game Arena, chess (text input) (Kaggle and Google DeepMind). The board's "Score" task is the model's
// rating in this game (the board's unit, not a percentage). Read through the helper in kaggle-game-arena.ts
// (Kaggle's documented public leaderboard endpoint). Its "Avg. Tokens/Turn" and "Avg. Cost/Turn" are per move,
// not per task, so they are kept as metrics.tokensPerTurn and costPerTurn (US dollars; the board shows cents),
// not as tokens and cost. The rating's confidence interval is kept as metrics.ciLow and ciHigh.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRows } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'kaggle-game-arena-chess',
  url: 'https://www.kaggle.com/benchmarks/kaggle/chess-text',
  feed: kaggleFeed('kaggle', 'chess-text'),
  terms: KAGGLE_TERMS,
  aliases: {},
  fetch: () => kaggleRows('kaggle', 'chess-text', 'Score', 1, { tokensPerTurn: { task: 'Avg. Tokens/Turn' }, costPerTurn: { task: 'Avg. Cost/Turn', scale: 0.01 } }),
};
export default board;
