// Agents solve terminal tasks that change across versions. The score is the published accuracy across versioned tasks.
// Score: step accuracy (%). 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/evoarena.ts';
const board: Leaderboard = { benchmark: "evoarena-terminal-bench-evo", url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 fetch: () => trackRows("^Terminal-Bench-Evo; Step;", "^Terminal-Bench-Evo; Step;\\s*") };
export default board;
