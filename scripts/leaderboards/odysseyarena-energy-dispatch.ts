// Agents manage energy dispatch under hidden rules. The score is average task success over four trials.
// Score: avg@4 success (%). 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/odysseyarena.ts';
const board: Leaderboard = { benchmark: "odysseyarena-energy-dispatch", url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 fetch: () => trackRows("^OdysseyArena-Lite; energyDispatch; Avg4", "^OdysseyArena-Lite; energyDispatch; Avg4;?\\s*") };
export default board;
