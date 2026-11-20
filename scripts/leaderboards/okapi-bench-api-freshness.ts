// Okapi Bench: API Freshness (Kaggle Benchmarks, by okapibuddy): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'okapi-bench-api-freshness',
  url: 'https://www.kaggle.com/benchmarks/okapibuddy/okapi-bench-api-freshness',
  feed: kaggleFeed('okapibuddy', 'okapi-bench-api-freshness'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('okapibuddy', 'okapi-bench-api-freshness', "(Overall)", 1),
};
export default board;
