// Agents choose safe interface actions on the Mobile test set. The published safety score combines task success and attack resistance.
// Score: published safety score S (%). 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows, ADEPTS_STATS } from '../lib/boards/adepts-bench.ts';
const board: Leaderboard = { benchmark: "adepts-bench-mobile", url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases, stats: ADEPTS_STATS,
 fetch: () => trackRows("^Mobile$", "^Mobile$") };
export default board;
