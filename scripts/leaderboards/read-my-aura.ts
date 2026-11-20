// Read My Aura (Kaggle Benchmarks, by ashleyeromano): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "aura-claimed-perception" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'read-my-aura',
  url: 'https://www.kaggle.com/benchmarks/ashleyeromano/read-my-aura',
  feed: kaggleFeed('ashleyeromano', 'read-my-aura'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('ashleyeromano', 'read-my-aura', "aura-claimed-perception", 1),
};
export default board;
