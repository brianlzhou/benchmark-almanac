// Models answer spoken Llama Questions. The score is the published accuracy.
// Score: accuracy (%). 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows, OPENAUDIO_STATS } from '../lib/boards/openaudiobench.ts';
const board: Leaderboard = { benchmark: "openaudiobench-llama-questions", url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases, stats: OPENAUDIO_STATS,
 fetch: () => trackRows("^Llama Questions;", "^Llama Questions;\\s*") };
export default board;
