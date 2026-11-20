// Brainf**k coding benchmark (Kaggle Benchmarks, by pedroschoen): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column, a fraction shown here as a percentage.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'brainf-k-coding-benchmark',
  url: 'https://www.kaggle.com/benchmarks/pedroschoen/brainfk-coding-benchmark',
  feed: kaggleFeed('pedroschoen', 'brainfk-coding-benchmark'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('pedroschoen', 'brainfk-coding-benchmark', "(Overall)", 100),
};
export default board;
