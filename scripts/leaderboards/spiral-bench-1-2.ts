// Spiral-Bench v1.2 on eqbench.com. spiral-bench.js holds the board as a CSV string. Its score_0_100, the safety
// score built from the judged protective and risky behaviors, is the score. Read through eqbenchRows in
// creative-writing-v3.ts.
import type { Leaderboard } from './types.ts';
import { EQBENCH_ALIASES, EQBENCH_TERMS, eqbenchFeed, eqbenchRows } from './creative-writing-v3.ts';

const board: Leaderboard = {
  benchmark: 'spiral-bench-1-2',
  url: 'https://eqbench.com/spiral-bench.html',
  feed: `${eqbenchFeed('spiral-bench.js', 'leaderboardDataDelusion')} score_0_100`,
  terms: EQBENCH_TERMS,
  aliases: EQBENCH_ALIASES,
  fetch: () => eqbenchRows('spiral-bench.js', 'leaderboardDataDelusion', 'score_0_100', 1),
};
export default board;
