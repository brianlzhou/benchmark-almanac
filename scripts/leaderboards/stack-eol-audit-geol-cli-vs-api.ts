// Stack EOL Audit: geol CLI vs API (Kaggle Benchmarks, by adriensales): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "stack-eol-audit-geolcheck" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'stack-eol-audit-geol-cli-vs-api',
  url: 'https://www.kaggle.com/benchmarks/adriensales/stack-eol-audit-geol-cli-vs-api',
  feed: kaggleFeed('adriensales', 'stack-eol-audit-geol-cli-vs-api'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('adriensales', 'stack-eol-audit-geol-cli-vs-api', "stack-eol-audit-geolcheck", 1),
};
export default board;
