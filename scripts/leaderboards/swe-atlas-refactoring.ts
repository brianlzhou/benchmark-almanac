// SWE Atlas Refactoring: Scale's board has one table. The score is the task resolve rate in percent (the
// refactor must pass the tests and the rubrics). Names carry the harness and effort.
import type { Leaderboard } from './types.ts';
import { SCALE_TERMS, fetchScaleEntries, scaleFeed, scaleRows, scaleUrl } from '../lib/scale.ts';

const PAGE = scaleUrl('sweatlas-refactoring');

const board: Leaderboard = {
  benchmark: 'swe-atlas-refactoring',
  url: PAGE,
  feed: scaleFeed(PAGE),
  terms: SCALE_TERMS,
  aliases: {},
  fetch: async () => scaleRows(await fetchScaleEntries(PAGE)),
};
export default board;
