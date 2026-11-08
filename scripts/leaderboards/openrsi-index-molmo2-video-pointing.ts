// Agents tune video inputs and inference for a frozen Molmo2 model. The score is held-out spatiotemporal pointing soft F1.
// Score: spatiotemporal pointing soft F1. 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/openrsi-index.ts';
const board: Leaderboard = { benchmark: "openrsi-index-molmo2-video-pointing", url: "https://index.openrsi.foundation/tasks/molmo2-pointing-refined.html", feed: "https://index.openrsi.foundation/tasks/molmo2-pointing-refined.html", terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 chart: {...sourceBoard.chart!, y: {...sourceBoard.chart!.y, unit: "score"}},
 fetch: () => trackRows("^Molmo2\\ Video\\-Pointing\\ Inference\\ Strategy;", "^Molmo2\\ Video\\-Pointing\\ Inference\\ Strategy;\\s*") };
export default board;
