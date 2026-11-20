// Paragraph Instruction Following (Kaggle Benchmarks, by lwolwo): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'paragraph-instruction-following',
  url: 'https://www.kaggle.com/benchmarks/lwolwo/paragraph-instruction-following',
  feed: kaggleFeed('lwolwo', 'paragraph-instruction-following'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('lwolwo', 'paragraph-instruction-following', "(Overall)", 1),
};
export default board;
