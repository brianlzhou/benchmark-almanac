// VISTA (Scale's visual-language understanding board): one table. The score is the Average Task Accuracy in
// percent: the share of rubric questions a three-judge jury finds satisfied, averaged over tasks.
import type { Leaderboard } from './types.ts';
import { SCALE_TERMS, fetchScaleEntries, scaleFeed, scaleRows, scaleUrl } from '../lib/scale.ts';

const PAGE = scaleUrl('visual_language_understanding');

const board: Leaderboard = {
  benchmark: 'vista-scale',
  url: PAGE,
  feed: scaleFeed(PAGE),
  terms: SCALE_TERMS,
  aliases: {},
  fetch: async () => scaleRows(await fetchScaleEntries(PAGE)),
};
export default board;
