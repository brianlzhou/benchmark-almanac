// PRBench: Scale runs two boards, Legal and Finance. This importer reads the Legal board, which the benchmark's
// record links, on the full task set (the Hard subset appears only in the page's text). The score is the
// rubric-weighted score clipped to 0 to 1, which the board shows times 100.
import type { Leaderboard } from './types.ts';
import { SCALE_TERMS, fetchScaleEntries, scaleFeed, scaleRows, scaleUrl } from '../lib/scale.ts';

const PAGE = scaleUrl('prbench-legal');

const board: Leaderboard = {
  benchmark: 'prbench',
  url: PAGE,
  feed: scaleFeed(PAGE),
  terms: SCALE_TERMS,
  aliases: {},
  fetch: async () => scaleRows(await fetchScaleEntries(PAGE)),
};
export default board;
