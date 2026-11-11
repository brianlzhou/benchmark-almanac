// SWE-Bench Pro private dataset: held-out issue resolve rate in percent.
// This cohort is separate from the public dataset and must not compete in its ranking.
import type { Leaderboard } from './types.ts';
import { SCALE_ALIASES, SCALE_TERMS, fetchScaleEntries, scaleFeed, scaleRows, scaleUrl } from '../lib/scale.ts';
const PAGE = scaleUrl('swe_bench_pro');
const board: Leaderboard = {
  benchmark: 'swe-bench-pro-private', url: PAGE, feed: scaleFeed(PAGE, 'private'),
  terms: `${SCALE_TERMS} The almanac credits and links Scale's source.`,
  aliases: SCALE_ALIASES,
  fetch: async () => scaleRows(await fetchScaleEntries(PAGE, 'private'), (n) => ({ harness: n.harness ?? (n.marks.includes('*') ? 'mini-SWE-agent' : 'SWE-agent') })),
};
export default board;
