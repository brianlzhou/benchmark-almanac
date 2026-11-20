// Hold or Fold: AI Under Pushback (Kaggle Benchmarks, by sundasn): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'hold-or-fold-ai-under-pushback',
  url: 'https://www.kaggle.com/benchmarks/sundasn/hold-or-fold-ai-under-pushback',
  feed: kaggleFeed('sundasn', 'hold-or-fold-ai-under-pushback'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('sundasn', 'hold-or-fold-ai-under-pushback', "(Overall)", 1),
};
export default board;
