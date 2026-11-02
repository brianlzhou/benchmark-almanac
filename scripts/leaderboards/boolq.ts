// BoolQ on the SuperGLUE board. super.gluebenchmark.com shows each task as a column of its leaderboard; the
// data comes from the public Firebase database that superglue.ts reads (the best SuperGLUE 2.0 submission
// per uploader). The score is the BoolQ column: accuracy, the board's only BoolQ number. Rows carry the submission date.
import type { Leaderboard } from './types.ts';
import { SUPERGLUE_ALIASES, SUPERGLUE_FEED, SUPERGLUE_PAGE, SUPERGLUE_TERMS, superglueRows } from './superglue.ts';

const board: Leaderboard = {
  benchmark: 'boolq',
  url: SUPERGLUE_PAGE,
  feed: `${SUPERGLUE_FEED}, task BoolQ`,
  terms: SUPERGLUE_TERMS,
  aliases: SUPERGLUE_ALIASES,
  fetch: () => superglueRows((_, task) => task('BoolQ')?.score),
};
export default board;
