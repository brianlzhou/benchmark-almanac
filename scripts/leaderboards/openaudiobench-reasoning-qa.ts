// Models answer spoken reasoning questions. The score is the published accuracy.
// Score: accuracy (%). 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/openaudiobench.ts';
const board: Leaderboard = { benchmark: "openaudiobench-reasoning-qa", url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 fetch: () => trackRows("^Reasoning QA;", "^Reasoning QA;\\s*") };
export default board;
