// ScopeCheck: evidence before numbers (Kaggle Benchmarks, by haxforscience): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'scopecheck-evidence-before-numbers',
  url: 'https://www.kaggle.com/benchmarks/haxforscience/scopecheck-evidence-before-numbers',
  feed: kaggleFeed('haxforscience', 'scopecheck-evidence-before-numbers'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('haxforscience', 'scopecheck-evidence-before-numbers', "(Overall)", 1),
};
export default board;
