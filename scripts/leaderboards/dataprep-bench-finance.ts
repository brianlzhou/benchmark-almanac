// Models prepare training data for the finance domain. The score is the published downstream average after backbone training.
// Score: published domain average. 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/dataprep-bench.ts';
const board: Leaderboard = { benchmark: "dataprep-bench-finance", parts: {
  'CPA-KQA_11': { name: 'CPA-KQA', group: 'Split' },
  'FinEval-KR_12': { name: 'FinEval-KR', group: 'Split' },
  XFinBench_13: { name: 'XFinBench', group: 'Split' },
}, url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 fetch: () => trackRows("; Finance;", "; Finance; downstream average") };
export default board;
