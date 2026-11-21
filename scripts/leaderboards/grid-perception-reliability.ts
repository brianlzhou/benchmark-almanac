// Grid Perception Reliability (Kaggle Benchmarks, by flamki): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column, a fraction shown here as a percentage.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'grid-perception-reliability',
  url: 'https://www.kaggle.com/benchmarks/flamki/grid-perception-reliability',
  feed: kaggleFeed('flamki', 'grid-perception-reliability'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('flamki', 'grid-perception-reliability', "(Overall)", 100),
};
export default board;
