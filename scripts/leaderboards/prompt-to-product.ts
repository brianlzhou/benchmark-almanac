// Prompt to Product (Kaggle Benchmarks, by shashcoder): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'prompt-to-product',
  url: 'https://www.kaggle.com/benchmarks/shashcoder/prompt-to-product',
  feed: kaggleFeed('shashcoder', 'prompt-to-product'),
  terms: KAGGLE_TERMS,
  parts: {
    studySprint: 'StudySprint',
    shopFront: 'ShopFront',
    dataDash: 'DataDash',
  },
  fetch: () => kaggleRowsWithBounds('shashcoder', 'prompt-to-product', "(Overall)", 1, {
    studySprint: { task: 'Prompt to Product: StudySprint' },
    shopFront: { task: 'Prompt to Product: ShopFront' },
    dataDash: { task: 'Prompt to Product: DataDash' },
  }),
};
export default board;
