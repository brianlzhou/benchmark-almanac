// Models complete Chinese financial language tasks. The score is the published average of the application task metrics.
// Score: published application Avg.. 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/cflue.ts';
const board: Leaderboard = { benchmark: "cflue-application", url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 fetch: () => trackRows("^Application", "^Application; Fin_TC accuracy$") };
export default board;
