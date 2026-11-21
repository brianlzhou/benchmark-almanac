// Agents trade under hidden market dynamics. The score is average return relative to initial capital over four trials.
// Score: avg@4 return (%). 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows, ODYSSEY_STATS } from '../lib/boards/odysseyarena.ts';
const board: Leaderboard = { benchmark: "odysseyarena-ai-trading", url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases, stats: { passAt4: ODYSSEY_STATS.passAt4 },
 fetch: () => trackRows("^OdysseyArena-Lite; aiTrading; Avg4", "^OdysseyArena-Lite; aiTrading; Avg4;?\\s*") };
export default board;
