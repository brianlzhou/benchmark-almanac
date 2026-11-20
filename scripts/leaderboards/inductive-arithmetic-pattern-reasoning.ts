// Inductive Arithmetic Pattern Reasoning (Kaggle Benchmarks, by indraagustian): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'inductive-arithmetic-pattern-reasoning',
  url: 'https://www.kaggle.com/benchmarks/indraagustian/inductive-arithmetic-pattern-reasoning',
  feed: kaggleFeed('indraagustian', 'inductive-arithmetic-pattern-reasoning'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('indraagustian', 'inductive-arithmetic-pattern-reasoning', "(Overall)", 1),
};
export default board;
