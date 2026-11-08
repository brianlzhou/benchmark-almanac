// Agents optimize a sparse-attention prefill operator under a fixed budget. The score is speedup against the paired reference run.
// Score: paired sparse-prefill speedup. 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/openrsi-index.ts';
const board: Leaderboard = { benchmark: "openrsi-index-minference-sparse-prefill", url: "https://index.openrsi.foundation/tasks/minference-sparse-prefill.html", feed: "https://index.openrsi.foundation/tasks/minference-sparse-prefill.html", terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 chart: {...sourceBoard.chart!, y: {...sourceBoard.chart!.y, unit: "speedup"}},
 fetch: () => trackRows("^MInference\\ 32\\-Head\\ Sparse\\ Prefill\\ Kernel;", "^MInference\\ 32\\-Head\\ Sparse\\ Prefill\\ Kernel;\\s*") };
export default board;
