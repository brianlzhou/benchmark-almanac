// Paraphrase Stability Benchmark (Kaggle Benchmarks, by chauhanbalaji): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'paraphrase-stability-benchmark',
  url: 'https://www.kaggle.com/benchmarks/chauhanbalaji/paraphrase-stability-benchmark',
  feed: kaggleFeed('chauhanbalaji', 'paraphrase-stability-benchmark'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('chauhanbalaji', 'paraphrase-stability-benchmark', "(Overall)", 1),
};
export default board;
