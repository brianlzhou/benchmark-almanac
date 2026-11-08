// Models answer driving prediction questions. The score is the published GPT evaluation score for this task family.
// Score: published task GPT score. 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/drivebench.ts';
const board: Leaderboard = { benchmark: "drivebench-prediction", url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 fetch: () => trackRows("^Prediction", "^Prediction\\s*") };
export default board;
