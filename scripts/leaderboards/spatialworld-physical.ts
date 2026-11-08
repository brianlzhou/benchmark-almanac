// Agents complete tasks in physical environments. The score is the published overall success rate across physical task categories.
// Score: Physical Overall success (%). 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/spatialworld.ts';
const board: Leaderboard = { benchmark: "spatialworld-physical", url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 fetch: () => trackRows("^Physical$", "^.*$") };
export default board;
