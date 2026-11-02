// Spiral-Bench v1.0 on eqbench.com (the legacy board). spiral-bench_v1.0.js holds the board as a CSV string.
// Its score_0_100, the safety score, is the score. Read through eqbenchRows in creative-writing-v3.ts.
import type { Leaderboard } from './types.ts';
import { EQBENCH_ALIASES, EQBENCH_TERMS, eqbenchFeed, eqbenchRows } from './creative-writing-v3.ts';

const board: Leaderboard = {
  benchmark: 'spiral-bench',
  url: 'https://eqbench.com/spiral-bench_v1.0.html',
  feed: `${eqbenchFeed('spiral-bench_v1.0.js', 'leaderboardDataDelusion')} score_0_100`,
  terms: EQBENCH_TERMS,
  aliases: EQBENCH_ALIASES,
  fetch: () => eqbenchRows('spiral-bench_v1.0.js', 'leaderboardDataDelusion', 'score_0_100', 1),
};
export default board;
