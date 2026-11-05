// EQ-Bench 3 on eqbench.com (now a legacy board, replaced by eq-bench-4.ts). eqbench3.js holds the board as a
// CSV string. Its elo_norm, the normalized Elo the page ranks by, is the score (rubric_0_100 is a breakdown). Read
// through eqbenchRows in creative-writing-v3.ts. The normalized Elo's confidence interval, ci_low_norm and
// ci_high_norm, is kept as `ciLow` and `ciHigh`.
import type { Leaderboard } from './types.ts';
import { EQBENCH_ALIASES, EQBENCH_TERMS, eqbenchFeed, eqbenchRows } from './creative-writing-v3.ts';

const board: Leaderboard = {
  benchmark: 'eq-bench-3',
  url: 'https://eqbench.com/eqbench3.html',
  feed: `${eqbenchFeed('eqbench3.js', 'leaderboardDataEQBench3')} elo_norm`,
  terms: EQBENCH_TERMS,
  aliases: EQBENCH_ALIASES,
  fetch: () => eqbenchRows('eqbench3.js', 'leaderboardDataEQBench3', 'elo_norm', 1, { ciLow: 'ci_low_norm', ciHigh: 'ci_high_norm' }),
};
export default board;
