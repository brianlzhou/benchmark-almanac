// Models answer explicit requests during audio and video streams. The score is the published average across tasks T1 through T7.
// Score: explicit-request Avg. (%). 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/omni-interactscope.ts';
const board: Leaderboard = { benchmark: "omni-interactscope-explicit-request", url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 fetch: () => trackRows("^Explicit request", "^Explicit request;\\s*") };
export default board;
