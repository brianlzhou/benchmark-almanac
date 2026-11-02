// CB (CommitmentBank) on the SuperGLUE board. super.gluebenchmark.com shows each task as a column of its
// leaderboard; the data comes from the public Firebase database that superglue.ts reads (the best SuperGLUE
// 2.0 submission per uploader). The CB column shows two numbers, "Avg. F1 / Accuracy". The score here is
// the accuracy, the number lab cards report for CB (GPT-3 and PaLM 2 papers), so board and card rows compare.
// Rows carry the submission date.
import type { Leaderboard } from './types.ts';
import { SUPERGLUE_ALIASES, SUPERGLUE_FEED, SUPERGLUE_PAGE, SUPERGLUE_TERMS, superglueRows } from './superglue.ts';

const board: Leaderboard = {
  benchmark: 'cb',
  url: SUPERGLUE_PAGE,
  feed: `${SUPERGLUE_FEED}, task CB accuracy`,
  terms: SUPERGLUE_TERMS,
  aliases: SUPERGLUE_ALIASES,
  fetch: () => superglueRows((_, task) => task('CB')?.accuracy),
};
export default board;
