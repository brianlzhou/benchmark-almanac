// Preserve the published per-turn cost as costPerTurnUnspecifiedUnit because this feed does not declare a currency unit.
// Kaggle Game Arena, dots and boxes (Kaggle and Google DeepMind). The board's "Score" task is the model's
// rating in this game (the board's unit, not a percentage). Its "Avg. Tokens/Turn" is kept as
// `turnTokens` (tokens per move, not per task). Its "Avg. Cost/Turn" gives no currency unit, so it remains a scoped metric. The
// rating's uneven confidence interval is kept as its bounds, `ciLow` and `ciHigh`.
// Read through the helper in kaggle-game-arena.ts (Kaggle's documented public leaderboard endpoint).
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRows } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'kaggle-game-arena-dots-and-boxes',
  url: 'https://www.kaggle.com/benchmarks/kaggle/dots-and-boxes',
  feed: kaggleFeed('kaggle', 'dots-and-boxes'),
  terms: KAGGLE_TERMS,
  aliases: {},
  fetch: () => kaggleRows('kaggle', 'dots-and-boxes', 'Score', 1, { turnTokens: { task: 'Avg. Tokens/Turn' }, costPerTurnUnspecifiedUnit: { task: 'Avg. Cost/Turn' } }),
};
export default board;
