// Grade Your Own Homework: Can LLMs Judge Each Other (Kaggle Benchmarks, by anish23101): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'grade-your-own-homework-can-llms-judge-each-other',
  url: 'https://www.kaggle.com/benchmarks/anish23101/grade-your-own-homework-can-llms-judge-each-other',
  feed: kaggleFeed('anish23101', 'grade-your-own-homework-can-llms-judge-each-other'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('anish23101', 'grade-your-own-homework-can-llms-judge-each-other', "(Overall)", 1),
};
export default board;
