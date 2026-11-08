// Models value companies using financial evidence and calculations. The score is the published CorporateValuation percentage.
// Score: published suite score (%). 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/finstepbench.ts';
const board: Leaderboard = { benchmark: "finstepbench-corporatevaluation", url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 fetch: () => trackRows("^FinStepBench - CorporateValuation", "^FinStepBench - CorporateValuation;?\\s*") };
export default board;
