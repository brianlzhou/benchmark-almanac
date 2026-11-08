// Models identify chemical entities in biomedical text. The score is test-set F1.
// Score: F1 (%). 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/mol-instructions.ts';
const board: Leaderboard = { benchmark: "mol-instructions-chemical-entity-recognition", url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 fetch: () => trackRows("^Chemical Entity Recognition,", "^.*$") };
export default board;
