// Models prepare training data for the math domain. The score is the published downstream average after backbone training.
// Score: published domain average. 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows, dataprepStats } from '../lib/boards/dataprep-bench.ts';
const board: Leaderboard = { benchmark: "dataprep-bench-math", stats: dataprepStats(['GSM8K_1','AMC23_2','AIME24_3','M-Math_4','OB_5','M500_6','GK24_7'], ['Avg_8','MMLU-R_9','Avg_10','CPA-KQA_11','FinEval-KR_12','XFinBench_13','Avg_14']), parts: {
  GSM8K_1: { name: 'GSM8K', group: 'Split' },
  AMC23_2: { name: 'AMC23', group: 'Split' },
  AIME24_3: { name: 'AIME24', group: 'Split' },
  'M-Math_4': { name: 'M-Math', group: 'Split' },
  OB_5: { name: 'OlympiadBench', group: 'Split' },
  M500_6: { name: 'MATH-500', group: 'Split' },
  GK24_7: { name: 'Gaokao 2024', group: 'Split' },
}, url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 fetch: () => trackRows("; Math;", "; Math; downstream average") };
export default board;
