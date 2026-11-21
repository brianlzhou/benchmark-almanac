// Models prepare training data for the general domain. The score is the published downstream average after backbone training.
// Score: published domain average. 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows, dataprepStats } from '../lib/boards/dataprep-bench.ts';
const board: Leaderboard = { benchmark: "dataprep-bench-general", stats: dataprepStats([], ['GSM8K_1','AMC23_2','AIME24_3','M-Math_4','OB_5','M500_6','GK24_7','Avg_8','MMLU-R_9','Avg_10','CPA-KQA_11','FinEval-KR_12','XFinBench_13','Avg_14']), url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 fetch: () => trackRows("; General;", "; General; downstream average") };
export default board;
