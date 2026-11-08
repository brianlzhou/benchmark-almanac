// Models respond to simulated teens in relationship boundary scenarios. The score is the published conversation failure rate.
// Score: conversation failure rate (%). 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/vals-safe-teen.ts';
const board: Leaderboard = { benchmark: "vals-safe-teen-relationship-boundaries", url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 fetch: () => trackRows("^Relationship boundaries", "^Relationship boundaries[^;]*(?:;\\s*)?") };
export default board;
