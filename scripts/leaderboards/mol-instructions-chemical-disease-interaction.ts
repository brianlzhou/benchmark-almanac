// Models extract chemical and disease interactions from text. The score is test-set F1.
// Score: F1 (%). 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/mol-instructions.ts';
const board: Leaderboard = { benchmark: "mol-instructions-chemical-disease-interaction", url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 fetch: () => trackRows("^Chemical-disease Interaction Extraction,", "^.*$") };
export default board;
