// Kaggle Game Arena, word art (Kaggle and Google DeepMind). The board's "Score" task is the model's rating in this
// game (the board's unit, not a percentage). Its "Avg. Tokens/Turn" is kept as metrics.tokensPerTurn (per move,
// not per task); "Avg. Cost/Turn" is not kept, since the feed does not state its unit. Read through the helper in
// kaggle-game-arena.ts (Kaggle's documented public leaderboard endpoint).
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRows } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'kaggle-game-arena-word-art',
  url: 'https://www.kaggle.com/benchmarks/kaggle/word-art',
  feed: kaggleFeed('kaggle', 'word-art'),
  terms: KAGGLE_TERMS,
  aliases: {},
  fetch: () => kaggleRows('kaggle', 'word-art', 'Score', 1, { tokensPerTurn: { task: 'Avg. Tokens/Turn' } }),
};
export default board;
