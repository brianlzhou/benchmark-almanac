// Models provide timely proactive assistance during audio and video streams. The score is the published T8 assistance recall.
// Score: T8 Overall recall (%). 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/omni-interactscope.ts';
const board: Leaderboard = { benchmark: "omni-interactscope-proactive", url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 fetch: () => trackRows("^Proactive", "^Proactive;\\s*") };
export default board;
