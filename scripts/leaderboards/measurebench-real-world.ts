// Models read values and units from real instrument images. The score is the published overall measurement accuracy.
// Score: real-world overall accuracy (%). 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/measurebench.ts';
const board: Leaderboard = { benchmark: "measurebench-real-world", url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 fetch: () => trackRows("^real-world$", "^real-world$") };
export default board;
