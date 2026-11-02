// SWE-bench Lite (300 issues). swebench.com builds every board from data/leaderboards.json in the
// SWE-bench/swe-bench.github.io repository. This one is the board named "Lite". Read through sweBenchRows in
// swe-bench-verified.ts: % resolved is the score, the agent the harness and the cost per task instance kept.
import type { Leaderboard } from './types.ts';
import { SWE_BENCH_ALIASES, SWE_BENCH_FEED, SWE_BENCH_TERMS, sweBenchRows } from './swe-bench-verified.ts';

const board: Leaderboard = {
  benchmark: 'swe-bench-lite',
  url: 'https://www.swebench.com/lite.html',
  feed: `${SWE_BENCH_FEED} (board "Lite")`,
  terms: SWE_BENCH_TERMS,
  aliases: SWE_BENCH_ALIASES,
  fetch: () => sweBenchRows('Lite'),
};
export default board;
