// SWE-bench Multilingual: the "Multilingual" board in the same swebench.com data file as SWE-bench Verified
// (300 tasks in nine languages), scored as % resolved. Read through the helper in swe-bench-verified.ts.
import type { Leaderboard } from './types.ts';
import { SWE_BENCH_ALIASES, SWE_BENCH_FEED, SWE_BENCH_TERMS, sweBenchRows } from './swe-bench-verified.ts';

const board: Leaderboard = {
  benchmark: 'swe-bench-multilingual',
  url: 'https://www.swebench.com/multilingual.html',
  feed: `${SWE_BENCH_FEED} (board "Multilingual")`,
  terms: SWE_BENCH_TERMS,
  aliases: SWE_BENCH_ALIASES,
  fetch: () => sweBenchRows('Multilingual'),
};
export default board;
