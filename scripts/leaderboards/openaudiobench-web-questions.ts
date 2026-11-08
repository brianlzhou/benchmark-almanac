// Models answer spoken Web Questions. The score is the published judge quality score.
// Score: native judge quality score. 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/openaudiobench.ts';
const board: Leaderboard = { benchmark: "openaudiobench-web-questions", url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 fetch: () => trackRows("^Web Questions;", "^Web Questions;\\s*") };
export default board;
