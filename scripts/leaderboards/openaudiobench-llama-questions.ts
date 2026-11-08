// Models answer spoken Llama Questions. The score is the published accuracy.
// Score: accuracy (%). 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/openaudiobench.ts';
const board: Leaderboard = { benchmark: "openaudiobench-llama-questions", url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 fetch: () => trackRows("^Llama Questions;", "^Llama Questions;\\s*") };
export default board;
