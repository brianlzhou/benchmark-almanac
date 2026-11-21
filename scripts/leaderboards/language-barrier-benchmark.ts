// Language Barrier Benchmark (Kaggle Benchmarks, by eveliaveldrine): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column, a fraction shown here as a percentage.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'language-barrier-benchmark',
  url: 'https://www.kaggle.com/benchmarks/eveliaveldrine/language-barrier-benchmark',
  feed: kaggleFeed('eveliaveldrine', 'language-barrier-benchmark'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('eveliaveldrine', 'language-barrier-benchmark', "(Overall)", 100),
};
export default board;
