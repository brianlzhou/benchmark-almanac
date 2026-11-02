// SWE Atlas Test Writing: Scale's board has one table. The score is the task resolve rate in percent (the tests
// must pass the manifest check, the mutation test and the rubrics). Names carry the harness and effort. "*" marks
// runs with an elevated refusal rate, which Scale scored as failures.
import type { Leaderboard } from './types.ts';
import { SCALE_TERMS, fetchScaleEntries, scaleFeed, scaleRows, scaleUrl } from '../lib/scale.ts';

const PAGE = scaleUrl('sweatlas-tw');

const board: Leaderboard = {
  benchmark: 'swe-atlas-test-writing',
  url: PAGE,
  feed: scaleFeed(PAGE),
  terms: SCALE_TERMS,
  aliases: {},
  fetch: async () => scaleRows(await fetchScaleEntries(PAGE)),
};
export default board;
