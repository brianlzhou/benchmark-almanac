// EQ-Bench v2 on eqbench.com (the legacy board). eqbench-v2.js holds the board as a CSV string (model, score,
// params). The score column is the score and the random baseline row is dropped. The MAGI-Hard table in the same file is
// another benchmark and is not read. Read through eqbenchRows in creative-writing-v3.ts.
import type { Leaderboard } from './types.ts';
import { EQBENCH_ALIASES, EQBENCH_TERMS, eqbenchFeed, eqbenchRows } from './creative-writing-v3.ts';

const board: Leaderboard = {
  benchmark: 'eq-bench-2',
  url: 'https://eqbench.com/eqbench-v2.html',
  feed: `${eqbenchFeed('eqbench-v2.js', 'leaderboardDataEqbench')} score`,
  terms: EQBENCH_TERMS,
  aliases: EQBENCH_ALIASES,
  fetch: () => eqbenchRows('eqbench-v2.js', 'leaderboardDataEqbench', 'score', 1),
};
export default board;
