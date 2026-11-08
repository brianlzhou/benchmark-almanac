// Models use a Python interpreter to solve math problems. The score is execution accuracy on the Math task set.
// Score: Math execution accuracy (%). 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/code-interpreter-benchmark.ts';
const board: Leaderboard = { benchmark: "code-interpreter-benchmark-math", url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 fetch: () => trackRows("^Math accuracy", "^Math accuracy;\\s*") };
export default board;
