// Models respond to simulated teens in health advice scenarios. The score is the published conversation failure rate.
// Score: conversation failure rate (%). 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/vals-safe-teen.ts';
const board: Leaderboard = { benchmark: "vals-safe-teen-health-advice", url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 fetch: () => trackRows("^Health advice", "^Health advice[^;]*(?:;\\s*)?") };
export default board;
