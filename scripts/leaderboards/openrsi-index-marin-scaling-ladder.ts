// Agents design one optimizer for six model sizes. The score is the published complete six-rung reward relative to AdamH.
// Score: published complete six-rung reward ratio. Marin measurements include a result that failed staging guards.
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/openrsi-index.ts';
const board: Leaderboard = { benchmark: "openrsi-index-marin-scaling-ladder", url: "https://index.openrsi.foundation/tasks/marin-scaling-ladder.html", feed: "https://index.openrsi.foundation/tasks/marin-scaling-ladder.html", terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 chart: {...sourceBoard.chart!, y: {...sourceBoard.chart!.y, unit: "score"}},
 fetch: () => trackRows("^Marin Scaling Ladder;", "^Marin Scaling Ladder;\\s*") };
export default board;
