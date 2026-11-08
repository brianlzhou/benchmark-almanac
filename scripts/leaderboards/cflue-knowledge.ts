// Models answer Chinese financial qualification questions. The score is answer accuracy across the knowledge test.
// Score: knowledge answer accuracy (%). 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/cflue.ts';
const board: Leaderboard = { benchmark: "cflue-knowledge", url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 fetch: () => trackRows("^Knowledge accuracy$", "^Knowledge accuracy$") };
export default board;
