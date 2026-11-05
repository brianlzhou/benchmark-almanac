// Kaggle Game Arena, coin game (Kaggle and Google DeepMind). The board's "Score" task is the model's rating
// in this game (the board's unit, not a percentage). Its "Avg. Tokens/Turn" and "Avg. Cost/Turn" are per
// move, not per task, so they are kept as metrics.tokensPerTurn and costPerTurn (US dollars; the board shows
// cents), not as tokens or cost. Read through the helper in kaggle-game-arena.ts (Kaggle's documented
// public leaderboard endpoint).
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRows } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'kaggle-game-arena-coin-game',
  url: 'https://www.kaggle.com/benchmarks/kaggle/coin-game',
  feed: kaggleFeed('kaggle', 'coin-game'),
  terms: KAGGLE_TERMS,
  aliases: {},
  fetch: () => kaggleRows('kaggle', 'coin-game', 'Score', 1, { tokensPerTurn: { task: 'Avg. Tokens/Turn' }, costPerTurn: { task: 'Avg. Cost/Turn', scale: 0.01 } }),
};
export default board;
