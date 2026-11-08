// Models predict reaction reagents. The score is exact-match accuracy on the reagent prediction test set.
// Score: exact match (%). 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/mol-instructions.ts';
const board: Leaderboard = { benchmark: "mol-instructions-reagent-prediction", url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 fetch: () => trackRows("^Reagent Prediction,", "^.*$") };
export default board;
