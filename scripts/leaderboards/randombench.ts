// RandomBench (Kaggle Benchmarks, by benjaminbrumfield): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "RandomBench Last Digit" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'randombench',
  url: 'https://www.kaggle.com/benchmarks/benjaminbrumfield/randombench',
  feed: kaggleFeed('benjaminbrumfield', 'randombench'),
  terms: KAGGLE_TERMS,
  parts: {
    edges: 'Edges',
    favoriteNumber: 'Favorite number',
    multiplesOf10: 'Multiples of 10',
    primes: 'Primes',
    multiplesOf5: 'Multiples of 5',
    repeatedDigits: 'Repeated digits',
    uniformity: 'Uniformity',
    validAnswers: 'Valid answers',
  },
  fetch: () => kaggleRowsWithBounds('benjaminbrumfield', 'randombench', "RandomBench Last Digit", 1, {
    edges: { task: 'RandomBench Edges', interval: true },
    favoriteNumber: { task: 'RandomBench Favorite Number', interval: true },
    multiplesOf10: { task: 'RandomBench Multiples of 10', interval: true },
    primes: { task: 'RandomBench Primes', interval: true },
    multiplesOf5: { task: 'RandomBench Multiples of 5', interval: true },
    repeatedDigits: { task: 'RandomBench Repeated Digits', interval: true },
    uniformity: { task: 'RandomBench Uniformity', interval: true },
    validAnswers: { task: 'RandomBench Valid Answers', interval: true },
  }),
};
export default board;
