// Models predict reactants for target products. The score is exact-match accuracy on the retrosynthesis test set.
// Score: exact match (%). 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/mol-instructions.ts';
const board: Leaderboard = { benchmark: "mol-instructions-retrosynthesis", url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 fetch: () => trackRows("^Retrosynthesis,", "^.*$") };
export default board;
