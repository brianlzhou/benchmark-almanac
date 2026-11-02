// Kaggle Game Arena, Chess Openings (Kaggle and Google DeepMind). The board's "Score" task is the model's rating
// from games started at sampled openings (the board's unit, not a percentage). Read through the helper in
// kaggle-game-arena.ts.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRows } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'kaggle-game-arena-chess-openings',
  url: 'https://www.kaggle.com/benchmarks/kaggle/chess-text-openings',
  feed: kaggleFeed('kaggle', 'chess-text-openings'),
  terms: KAGGLE_TERMS,
  aliases: {},
  fetch: () => kaggleRows('kaggle', 'chess-text-openings', 'Score', 1),
};
export default board;
