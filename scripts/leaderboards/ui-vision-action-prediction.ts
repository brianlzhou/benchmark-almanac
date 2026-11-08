// Models predict the next desktop interface action. The score is the published step success rate.
// Score: step success rate (%). 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/ui-vision.ts';
const board: Leaderboard = { benchmark: "ui-vision-action-prediction", url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 fetch: () => trackRows("^Action prediction", "^Action prediction; step success;?\\s*") };
export default board;
