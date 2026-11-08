// Models locate cooking steps and describe each step. The score is CIDEr for the complete dense video description task.
// Score: dense description CIDEr. 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/youcook2.ts';
const board: Leaderboard = { benchmark: "youcook2-dense-description", url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 fetch: () => trackRows("^dense video description$", "^.*$") };
export default board;
