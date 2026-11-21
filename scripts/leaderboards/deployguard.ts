// DeployGuard (Kaggle Benchmarks, by sasankaweerakoon): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'deployguard',
  url: 'https://www.kaggle.com/benchmarks/sasankaweerakoon/deployguard',
  feed: kaggleFeed('sasankaweerakoon', 'deployguard'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('sasankaweerakoon', 'deployguard', "(Overall)", 1),
};
export default board;
