// Agents trade under hidden market dynamics. The score is average return relative to initial capital over four trials.
// Score: avg@4 return (%). 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/odysseyarena.ts';
const board: Leaderboard = { benchmark: "odysseyarena-ai-trading", url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 fetch: () => trackRows("^OdysseyArena-Lite; aiTrading; Avg4", "^OdysseyArena-Lite; aiTrading; Avg4;?\\s*") };
export default board;
