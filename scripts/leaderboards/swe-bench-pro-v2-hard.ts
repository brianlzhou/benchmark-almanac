// SWE-Bench Pro V2 Hard: the "hard" tab (SWE-Bench Pro V2 HARD) of Scale's SWE-Bench Pro V2 board, the tab the
// page opens on. The score is the resolve rate in percent. Names carry the harness and effort.
import type { Leaderboard } from './types.ts';
import { SCALE_TERMS, fetchScaleEntries, scaleFeed, scaleRows, scaleUrl } from '../lib/scale.ts';

const PAGE = scaleUrl('swe_bench_pro_public_v2');
const TAB = 'hard';

const board: Leaderboard = {
  benchmark: 'swe-bench-pro-v2-hard',
  url: PAGE,
  feed: scaleFeed(PAGE, TAB),
  terms: SCALE_TERMS,
  aliases: {},
  fetch: async () => scaleRows(await fetchScaleEntries(PAGE, TAB)),
};
export default board;
