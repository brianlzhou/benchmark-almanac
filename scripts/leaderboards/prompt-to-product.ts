// Prompt to Product (Kaggle Benchmarks, by shashcoder): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'prompt-to-product',
  url: 'https://www.kaggle.com/benchmarks/shashcoder/prompt-to-product',
  feed: kaggleFeed('shashcoder', 'prompt-to-product'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('shashcoder', 'prompt-to-product', "(Overall)", 1),
};
export default board;
