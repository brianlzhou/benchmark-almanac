// SQL Reality Check (Kaggle Benchmarks, by dhruvb2028): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column, a fraction shown here as a percentage.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'sql-reality-check',
  url: 'https://www.kaggle.com/benchmarks/dhruvb2028/sql-reality-check',
  feed: kaggleFeed('dhruvb2028', 'sql-reality-check'),
  terms: KAGGLE_TERMS,
  parts: {
    netRevenue: 'Net revenue',
    ticketState: 'Ticket state as of',
  },
  fetch: () => kaggleRowsWithBounds('dhruvb2028', 'sql-reality-check', "(Overall)", 100, {
    netRevenue: { task: 'SQL Reality Check - Net Revenue', scale: 100 },
    ticketState: { task: 'SQL Reality Check - Ticket State As Of', scale: 100 },
  }),
};
export default board;
