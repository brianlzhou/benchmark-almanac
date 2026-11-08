// Agents build 39 CAD parts from engineering drawings. The score is the published mean geometry score.
// Score: mean part geometry score. 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/frontiercad.ts';
const board: Leaderboard = { benchmark: "frontiercad-parts", url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 fetch: () => trackRows("^Parts;", "^Parts;\\s*") };
export default board;
