// Agents choose safe interface actions on the Desktop test set. The published safety score combines task success and attack resistance.
// Score: published safety score S (%). 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/adepts-bench.ts';
const board: Leaderboard = { benchmark: "adepts-bench-desktop", url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 fetch: () => trackRows("^Desktop$", "^Desktop$") };
export default board;
