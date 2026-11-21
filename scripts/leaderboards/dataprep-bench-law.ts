// Models prepare training data for the law domain. The score is the published downstream average after backbone training.
// Score: published domain average. 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows, dataprepStats } from '../lib/boards/dataprep-bench.ts';
const board: Leaderboard = { benchmark: "dataprep-bench-law", stats: dataprepStats(['LegalBench_1','LexGLUE_2'], ['Avg_3','MedCaseR._4','MedMCQA_5','MedR-Bench_6','Avg_7','MMLU-STEM_8','MMLU-Pro_9','GPQA_10','SuperGPQA_11','ChemBench_12','PIQA_13','SciBench_14','Avg_15']), parts: {
  LegalBench_1: { name: 'LegalBench', group: 'Split' },
  LexGLUE_2: { name: 'LexGLUE', group: 'Split' },
}, url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 fetch: () => trackRows("; Law;", "; Law; downstream average") };
export default board;
