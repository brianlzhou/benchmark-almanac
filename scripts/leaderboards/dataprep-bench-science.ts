// Models prepare training data for the science domain. The score is the published downstream average after backbone training.
// Score: published domain average. 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows, dataprepStats } from '../lib/boards/dataprep-bench.ts';
const board: Leaderboard = { benchmark: "dataprep-bench-science", stats: dataprepStats(['MMLU-STEM_8','MMLU-Pro_9','GPQA_10','SuperGPQA_11','ChemBench_12','PIQA_13','SciBench_14'], ['LegalBench_1','LexGLUE_2','Avg_3','MedCaseR._4','MedMCQA_5','MedR-Bench_6','Avg_7','Avg_15']), parts: {
  'MMLU-STEM_8': { name: 'MMLU-STEM', group: 'Split' },
  'MMLU-Pro_9': { name: 'MMLU-Pro', group: 'Split' },
  GPQA_10: { name: 'GPQA', group: 'Split' },
  SuperGPQA_11: { name: 'SuperGPQA', group: 'Split' },
  ChemBench_12: { name: 'ChemBench', group: 'Split' },
  PIQA_13: { name: 'PIQA', group: 'Split' },
  SciBench_14: { name: 'SciBench', group: 'Split' },
}, url: sourceBoard.url, feed: sourceBoard.feed, terms: sourceBoard.terms, aliases: sourceBoard.aliases,
 fetch: () => trackRows("; Science;", "; Science; downstream average") };
export default board;
