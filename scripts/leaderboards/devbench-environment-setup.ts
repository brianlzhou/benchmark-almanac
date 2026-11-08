// Models prepare repository environments. The score is the percentage that pass the example usage test.
// Score: example-usage pass rate (%). 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/devbench.ts';
const board: Leaderboard = { benchmark: "devbench-environment-setup", url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 fetch: () => trackRows("^Environment setup$", "^.*$") };
export default board;
