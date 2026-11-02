// SWE Atlas (Codebase QnA): Scale's board has one table. The score is the task resolve rate in percent (an
// answer must pass every rubric item). Names carry the harness ("(Claude Code)", "(Mini-SWE-Agent)") and effort.
// "*" marks runs with an elevated refusal rate, which Scale scored as failures.
import type { Leaderboard } from './types.ts';
import { SCALE_TERMS, fetchScaleEntries, scaleFeed, scaleRows, scaleUrl } from '../lib/scale.ts';

const PAGE = scaleUrl('sweatlas-qna');

const board: Leaderboard = {
  benchmark: 'swe-atlas',
  url: PAGE,
  feed: scaleFeed(PAGE),
  terms: SCALE_TERMS,
  aliases: {},
  fetch: async () => scaleRows(await fetchScaleEntries(PAGE)),
};
export default board;
