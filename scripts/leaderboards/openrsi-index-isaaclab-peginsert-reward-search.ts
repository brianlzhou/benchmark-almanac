// Agents design robot training rewards under a fixed budget. The score is held-out peg-insertion success as a fraction.
// Score: held-out peg-insertion success fraction. 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/openrsi-index.ts';
const board: Leaderboard = { benchmark: "openrsi-index-isaaclab-peginsert-reward-search", url: "https://index.openrsi.foundation/tasks/isaaclab-peginsert-reward-search.html", feed: "https://index.openrsi.foundation/tasks/isaaclab-peginsert-reward-search.html", terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 chart: {...sourceBoard.chart!, y: {...sourceBoard.chart!.y, unit: "score"}},
 fetch: () => trackRows("^Isaac\\ Lab\\ PegInsert\\ Reward\\ Search;", "^Isaac\\ Lab\\ PegInsert\\ Reward\\ Search;\\s*") };
export default board;
