// Pressure-Tested Alignment (Kaggle Benchmarks, by ramacharya06): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'pressure-tested-alignment',
  url: 'https://www.kaggle.com/benchmarks/ramacharya06/pressure-tested-alignment-do-agents-cheat-to-surv',
  feed: kaggleFeed('ramacharya06', 'pressure-tested-alignment-do-agents-cheat-to-surv'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('ramacharya06', 'pressure-tested-alignment-do-agents-cheat-to-surv', "(Overall)", 1),
};
export default board;
