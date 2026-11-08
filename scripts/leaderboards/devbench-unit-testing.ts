// Models generate unit tests for repositories. The score is the published oracle-test percentage.
// Score: unit oracle test (%). 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/devbench.ts';
const board: Leaderboard = { benchmark: "devbench-unit-testing", url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 fetch: () => trackRows("^Unit oracle test$", "^.*$") };
export default board;
