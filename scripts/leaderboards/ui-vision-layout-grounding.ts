// Models identify interface layout regions. The score is the published intersection over union percentage.
// Score: layout IoU (%). 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/ui-vision.ts';
const board: Leaderboard = { benchmark: "ui-vision-layout-grounding", url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 fetch: () => trackRows("^Layout grounding", "^.*$") };
export default board;
