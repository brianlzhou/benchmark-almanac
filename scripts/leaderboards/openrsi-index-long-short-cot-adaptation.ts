// Agents adapt mathematical reasoning examples under a fixed training budget. The score is accuracy across five math benchmarks.
// Score: five-benchmark math accuracy (%). 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/openrsi-index.ts';
const board: Leaderboard = { benchmark: "openrsi-index-long-short-cot-adaptation", url: "https://index.openrsi.foundation/tasks/learnability-cot.html", feed: "https://index.openrsi.foundation/tasks/learnability-cot.html", terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 chart: {...sourceBoard.chart!, y: {...sourceBoard.chart!.y, unit: "%"}},
 fetch: () => trackRows("^Learnability\\-Aware\\ Long/Short\\ CoT\\ Adaptation;", "^Learnability\\-Aware\\ Long/Short\\ CoT\\ Adaptation;\\s*") };
export default board;
