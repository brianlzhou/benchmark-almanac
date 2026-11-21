// codex of veritas (Kaggle Benchmarks, by bahramnemati): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'codex-of-veritas',
  url: 'https://www.kaggle.com/benchmarks/bahramnemati/codex-of-veritas',
  feed: kaggleFeed('bahramnemati', 'codex-of-veritas'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('bahramnemati', 'codex-of-veritas', "(Overall)", 1),
};
export default board;
