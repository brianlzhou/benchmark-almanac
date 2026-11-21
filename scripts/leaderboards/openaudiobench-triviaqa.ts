// Models answer spoken TriviaQA questions. The score is the published judge quality score.
// Score: native judge quality score. 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows, OPENAUDIO_STATS } from '../lib/boards/openaudiobench.ts';
const board: Leaderboard = { benchmark: "openaudiobench-triviaqa", url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases, stats: OPENAUDIO_STATS,
 fetch: () => trackRows("^TriviaQA;", "^TriviaQA;\\s*") };
export default board;
