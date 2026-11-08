// Models solve spatial placement questions in the RefSpatial expansion set. The score is the published overall accuracy.
// Score: published Overall accuracy (%). 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/refspatial-expand-bench.ts';
const board: Leaderboard = { benchmark: "refspatial-expand-bench-placement", url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 fetch: () => trackRows("^Placement$", "^.*$") };
export default board;
