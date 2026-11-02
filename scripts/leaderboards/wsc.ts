// WSC on the SuperGLUE board. super.gluebenchmark.com shows each task as a column of its leaderboard; the
// data comes from the public Firebase database that superglue.ts reads (the best SuperGLUE 2.0 submission
// per uploader). The score is the WSC column: accuracy, the board's only WSC number. Rows carry the submission date.
import type { Leaderboard } from './types.ts';
import { SUPERGLUE_ALIASES, SUPERGLUE_FEED, SUPERGLUE_PAGE, SUPERGLUE_TERMS, superglueRows } from './superglue.ts';

const board: Leaderboard = {
  benchmark: 'wsc',
  url: SUPERGLUE_PAGE,
  feed: `${SUPERGLUE_FEED}, task WSC`,
  terms: SUPERGLUE_TERMS,
  aliases: SUPERGLUE_ALIASES,
  fetch: () => superglueRows((_, task) => task('WSC')?.score),
};
export default board;
