// Models prepare training data for the law domain. The score is the published downstream average after backbone training.
// Score: published domain average. 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/dataprep-bench.ts';
const board: Leaderboard = { benchmark: "dataprep-bench-law", url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 fetch: () => trackRows("; Law;", "; Law; downstream average") };
export default board;
