// Preserve the published per-turn cost as costPerTurnUnspecifiedUnit because this feed does not declare a currency unit.
// Kaggle Game Arena, checkers (Kaggle and Google DeepMind). The board's "Score" task is the model's rating in this
// game (the board's unit, not a percentage). Its "Avg. Tokens/Turn" is kept as metrics.tokensPerTurn (per move,
// not per task); "Avg. Cost/Turn" is a scoped metric because the feed does not state its currency unit. Read through the helper in
// kaggle-game-arena.ts (Kaggle's documented public leaderboard endpoint).
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRows } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'kaggle-game-arena-checkers',
  url: 'https://www.kaggle.com/benchmarks/kaggle/checkers',
  feed: kaggleFeed('kaggle', 'checkers'),
  terms: KAGGLE_TERMS,
  aliases: {},
  fetch: () => kaggleRows('kaggle', 'checkers', 'Score', 1, { tokensPerTurn: { task: 'Avg. Tokens/Turn' }, costPerTurnUnspecifiedUnit: { task: 'Avg. Cost/Turn' } }),
};
export default board;
