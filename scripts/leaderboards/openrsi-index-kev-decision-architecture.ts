// Agents improve a decision model under a fixed budget. The score is the published exponential of negative macro log loss.
// Score: exp(-macro NLL). 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/openrsi-index.ts';
const board: Leaderboard = { benchmark: "openrsi-index-kev-decision-architecture", url: "https://index.openrsi.foundation/tasks/kev-decision-architecture.html", feed: "https://index.openrsi.foundation/tasks/kev-decision-architecture.html", terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 chart: {...sourceBoard.chart!, y: {...sourceBoard.chart!.y, unit: "score"}},
 fetch: () => trackRows("^Kev\\ Decision\\ Architecture;", "^Kev\\ Decision\\ Architecture;\\s*") };
export default board;
