// Agents select interaction context for a frozen browser model. The score is macro-averaged browser-action prediction quality.
// Score: browser-action prediction quality. 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/openrsi-index.ts';
const board: Leaderboard = { benchmark: "openrsi-index-molmoweb-context-allocation", url: "https://index.openrsi.foundation/tasks/molmoweb-interaction-context.html", feed: "https://index.openrsi.foundation/tasks/molmoweb-interaction-context.html", terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 chart: {...sourceBoard.chart!, y: {...sourceBoard.chart!.y, unit: "score"}},
 fetch: () => trackRows("^MolmoWeb\\ Interaction\\ Context\\ Allocation;", "^MolmoWeb\\ Interaction\\ Context\\ Allocation;\\s*") };
export default board;
