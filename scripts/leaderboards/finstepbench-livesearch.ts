// Models retrieve and verify live financial facts. The score is the published LiveSearch percentage.
// Score: published suite score (%). 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/finstepbench.ts';
const board: Leaderboard = { benchmark: "finstepbench-livesearch", url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 fetch: () => trackRows("^FinStepBench - LiveSearch", "^FinStepBench - LiveSearch;?\\s*") };
export default board;
