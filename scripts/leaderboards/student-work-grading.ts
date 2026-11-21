// Student-Work Grading (Kaggle Benchmarks, by davidporcaro): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'student-work-grading',
  url: 'https://www.kaggle.com/benchmarks/davidporcaro/student-work-grading',
  feed: kaggleFeed('davidporcaro', 'student-work-grading'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('davidporcaro', 'student-work-grading', "(Overall)", 1),
};
export default board;
