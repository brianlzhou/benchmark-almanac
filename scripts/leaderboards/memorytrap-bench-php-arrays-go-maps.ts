// MemoryTrap Bench: PHP arrays, Go maps (Kaggle Benchmarks, by nb9300): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'memorytrap-bench-php-arrays-go-maps',
  url: 'https://www.kaggle.com/benchmarks/nb9300/memorytrap-bench-php-arrays-go-maps',
  feed: kaggleFeed('nb9300', 'memorytrap-bench-php-arrays-go-maps'),
  terms: KAGGLE_TERMS,
  parts: {
    cold: 'Cold',
    versioned: 'Versioned',
    evidence: 'Evidence',
  },
  fetch: () => kaggleRowsWithBounds('nb9300', 'memorytrap-bench-php-arrays-go-maps', "(Overall)", 1, {
    cold: { task: 'MemoryTrap Cold' },
    versioned: { task: 'MemoryTrap Versioned' },
    evidence: { task: 'MemoryTrap Evidence' },
  }),
};
export default board;
