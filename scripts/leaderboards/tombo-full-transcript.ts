// Tombo Full Transcript (Kaggle Benchmarks, by mariofilho): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'tombo-full-transcript',
  url: 'https://www.kaggle.com/benchmarks/mariofilho/tombo-full-transcript',
  feed: kaggleFeed('mariofilho', 'tombo-full-transcript'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('mariofilho', 'tombo-full-transcript', "(Overall)", 1),
};
export default board;
