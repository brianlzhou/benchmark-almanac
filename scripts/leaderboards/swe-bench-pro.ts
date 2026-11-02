// SWE-Bench Pro: Scale's board, read from the "public" tab (SWE-Bench Pro (Public Dataset)), the tab the page
// opens on. The "private" tab scores the held-out set. The score is the resolve rate in percent. The page says
// it ran models with the SWE-agent scaffold and marks runs made with mini-SWE-agent with "*".
import type { Leaderboard } from './types.ts';
import { SCALE_TERMS, fetchScaleEntries, scaleFeed, scaleRows, scaleUrl } from '../lib/scale.ts';

const PAGE = scaleUrl('swe_bench_pro');
const TAB = 'public';

const board: Leaderboard = {
  benchmark: 'swe-bench-pro',
  url: PAGE,
  feed: scaleFeed(PAGE, TAB),
  terms: SCALE_TERMS,
  aliases: {},
  fetch: async () =>
    scaleRows(await fetchScaleEntries(PAGE, TAB), (n) => ({ harness: n.marks.includes('*') ? 'mini-SWE-agent' : 'SWE-agent' })),
};
export default board;
