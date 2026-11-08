// Models generate molecules from descriptions. The score is exact-match accuracy on the molecule design test set.
// Score: exact match (%). 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/mol-instructions.ts';
const board: Leaderboard = { benchmark: "mol-instructions-molecule-design", url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 fetch: () => trackRows("^Description-guided Molecule Design,", "^.*$") };
export default board;
