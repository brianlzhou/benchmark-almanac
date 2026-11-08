// Models generate acceptance tests for repositories. The score is the published oracle-test percentage.
// Score: acceptance oracle test (%). 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/devbench.ts';
const board: Leaderboard = { benchmark: "devbench-acceptance-testing", url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 fetch: () => trackRows("^Acceptance oracle test$", "^.*$") };
export default board;
