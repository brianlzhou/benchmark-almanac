// Agents solve questions about changing user preferences. The score is the published accuracy across versioned tasks.
// Score: step accuracy (%). 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/evoarena.ts';
const board: Leaderboard = { benchmark: "evoarena-personamem-evo", url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 fetch: () => trackRows("^PersonaMem-Evo; Step;", "^PersonaMem-Evo; Step;\\s*") };
export default board;
