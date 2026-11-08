// Models answer biomedical true or false questions. The score is test-set accuracy.
// Score: accuracy (%). 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/mol-instructions.ts';
const board: Leaderboard = { benchmark: "mol-instructions-true-false", url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 fetch: () => trackRows("^True or False,", "^.*$") };
export default board;
