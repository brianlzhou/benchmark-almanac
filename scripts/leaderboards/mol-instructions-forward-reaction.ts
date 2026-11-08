// Models predict reaction products from reactants. The score is exact-match accuracy on the forward reaction test set.
// Score: exact match (%). 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/mol-instructions.ts';
const board: Leaderboard = { benchmark: "mol-instructions-forward-reaction", url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 fetch: () => trackRows("^Forward Reaction Prediction,", "^.*$") };
export default board;
