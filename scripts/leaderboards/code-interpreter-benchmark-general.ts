// Models use a Python interpreter for general tasks. The score is the percentage of generated programs that execute.
// Score: General executable rate (%). 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/code-interpreter-benchmark.ts';
const board: Leaderboard = { benchmark: "code-interpreter-benchmark-general", url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 fetch: () => trackRows("^General executable rate", "^General executable rate;\\s*") };
export default board;
