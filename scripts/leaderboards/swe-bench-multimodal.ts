// SWE-bench Multimodal: the "Multimodal" board in the same swebench.com data file as SWE-bench Verified
// (JavaScript issues with images), scored as % resolved. Read through the helper in swe-bench-verified.ts.
import type { Leaderboard } from './types.ts';
import { SWE_BENCH_ALIASES, SWE_BENCH_FEED, SWE_BENCH_TERMS, sweBenchRows } from './swe-bench-verified.ts';

const board: Leaderboard = {
  benchmark: 'swe-bench-multimodal',
  url: 'https://www.swebench.com/multimodal.html',
  feed: `${SWE_BENCH_FEED} (board "Multimodal")`,
  terms: SWE_BENCH_TERMS,
  aliases: {
    ...SWE_BENCH_ALIASES,
    // every "Claude 3.5 Sonnet" row here is tagged "Model: claude-3-5-sonnet-20241022", although the
    // paper-baseline rows carry the board's 2024-10-06 date, which would resolve to the June model
    'Claude 3.5 Sonnet': 'claude-3-5-sonnet-october-2024',
    // the SWE-agent paper baselines (arXiv 2410.03859, 2024-10-04) predate the October model
    'Claude Sonnet 3.5': 'claude-3-5-sonnet',
  },
  fetch: () => sweBenchRows('Multimodal'),
};
export default board;
