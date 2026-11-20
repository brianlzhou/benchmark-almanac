// Can AI close the books? FP&A reasoning (Kaggle Benchmarks, by marcopolofpa): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'can-ai-close-the-books-fp-a-reasoning',
  url: 'https://www.kaggle.com/benchmarks/marcopolofpa/can-ai-close-the-books-fp-and-a-reasoning',
  feed: kaggleFeed('marcopolofpa', 'can-ai-close-the-books-fp-and-a-reasoning'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('marcopolofpa', 'can-ai-close-the-books-fp-and-a-reasoning', "(Overall)", 1),
};
export default board;
