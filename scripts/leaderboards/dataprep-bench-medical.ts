// Models prepare training data for the medical domain. The score is the published downstream average after backbone training.
// Score: published domain average. 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows, dataprepStats } from '../lib/boards/dataprep-bench.ts';
const board: Leaderboard = { benchmark: "dataprep-bench-medical", stats: dataprepStats(['MedMCQA_5','MedR-Bench_6','MedCaseR._4'], ['LegalBench_1','LexGLUE_2','Avg_3','Avg_7','MMLU-STEM_8','MMLU-Pro_9','GPQA_10','SuperGPQA_11','ChemBench_12','PIQA_13','SciBench_14','Avg_15']), url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases,
parts: {
  MedMCQA_5: { name: 'MedMCQA', group: 'Category' },
  'MedR-Bench_6': { name: 'MedR-Bench', group: 'Category' },
  'MedCaseR._4': { name: 'MedCaseReasoning', group: 'Category' },
},
 fetch: () => trackRows("; Medical;", "; Medical; downstream average") };
export default board;
