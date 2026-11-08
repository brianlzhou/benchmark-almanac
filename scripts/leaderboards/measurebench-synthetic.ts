// Models read values and units from generated instrument images. The score is the published overall measurement accuracy.
// Score: synthetic overall accuracy (%). 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/measurebench.ts';
const board: Leaderboard = { benchmark: "measurebench-synthetic", url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 fetch: () => trackRows("^synthetic$", "^synthetic$") };
export default board;
