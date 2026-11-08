// Agents complete entertainment tasks in digital environments. The score is the published digital task success rate.
// Score: Digital entertainment success (%). 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/spatialworld.ts';
const board: Leaderboard = { benchmark: "spatialworld-digital", url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 fetch: () => trackRows("^Digital entertainment$", "^.*$") };
export default board;
