// Agents operate repositories with changing hidden rules. The score is average task success over four trials.
// Score: avg@4 success (%). 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/odysseyarena.ts';
const board: Leaderboard = { benchmark: "odysseyarena-repo-system", url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 fetch: () => trackRows("^OdysseyArena-Lite; repoSystem; Avg4", "^OdysseyArena-Lite; repoSystem; Avg4;?\\s*") };
export default board;
