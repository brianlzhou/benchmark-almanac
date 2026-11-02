// DistressBench: Scale's board has one table. The score is the Weighted Rubric Score in percent: the share of
// clinician-assigned rubric weight the final reply meets, averaged over all 718 tasks and three runs. The page
// draws five deprecated entries grayed out without saying why, and the importer skips them.
import type { Leaderboard } from './types.ts';
import { SCALE_ALIASES, SCALE_TERMS, fetchScaleEntries, scaleFeed, scaleRows, scaleUrl } from '../lib/scale.ts';

const PAGE = scaleUrl('distressbench');

const board: Leaderboard = {
  benchmark: 'distressbench',
  url: PAGE,
  feed: scaleFeed(PAGE),
  terms: SCALE_TERMS,
  aliases: { ...SCALE_ALIASES },
  fetch: async () => scaleRows(await fetchScaleEntries(PAGE)),
};
export default board;
