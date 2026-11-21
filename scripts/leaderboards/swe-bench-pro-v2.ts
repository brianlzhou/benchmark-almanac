import { scaleRowsWithInterval as scaleRows } from './swe-bench-pro.ts';
// The published ranking assigns ties to different resolve rates.
// SWE-Bench Pro V2: the "full" tab (SWE-Bench Pro V2 Full) of Scale's board. The page opens on the "hard" tab,
// which the swe-bench-pro-v2-hard importer reads. The score is the resolve rate in percent. Names carry the
// harness and effort.
import type { Leaderboard } from './types.ts';
import { SCALE_ALIASES, SCALE_TERMS, fetchScaleEntries, scaleFeed,  scaleUrl } from '../lib/scale.ts';

const PAGE = scaleUrl('swe_bench_pro_public_v2');
const TAB = 'full';

const board: Leaderboard = {
  benchmark: 'swe-bench-pro-v2',
  harnesses: 'system',
  reference: ['mini-SWE-agent'],
  url: PAGE,
  feed: scaleFeed(PAGE, TAB),
  terms: SCALE_TERMS,
  aliases: { ...SCALE_ALIASES },
  stats: { tiedRank: { name: 'Tied rank', unit: 'count' } },
  fetch: async () => scaleRows(await fetchScaleEntries(PAGE, TAB), (_, e) =>
    typeof e.rank === 'number' ? { metrics: { tiedRank: e.rank } } : undefined),
};
export default board;
