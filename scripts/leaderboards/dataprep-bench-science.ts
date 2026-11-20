// Models prepare training data for the science domain. The score is the published downstream average after backbone training.
// Score: published domain average. 
import type { Leaderboard } from './types.ts';
import { sourceBoard, trackRows } from '../lib/boards/dataprep-bench.ts';
const board: Leaderboard = { benchmark: "dataprep-bench-science", parts: {
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
