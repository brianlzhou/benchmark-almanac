// Models write finance research reports. The score is the published DeepResearch percentage.
// Score: published suite score (%). 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/finstepbench.ts';
const board: Leaderboard = { benchmark: "finstepbench-deepresearch", url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 fetch: () => trackRows("^FinStepBench - DeepResearch", "^FinStepBench - DeepResearch;?\\s*") };
export default board;
