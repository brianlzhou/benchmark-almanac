// ArchDiagram (Kaggle Benchmarks, by drishtipeshwani): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'archdiagram',
  url: 'https://www.kaggle.com/benchmarks/drishtipeshwani/archdiagram',
  feed: kaggleFeed('drishtipeshwani', 'archdiagram'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('drishtipeshwani', 'archdiagram', "(Overall)", 1),
};
export default board;
