// ExcelFixBench tests spreadsheet agents on 60 real-world repair tasks.
// The score is the average task score over three trials, in the source's 0 to 100 scale.
// This importer reads the Appendix benchmark chart in the Hy4 flash model card.
// The chart rows were transcribed twice and matched on 2026-11-20.
import type { Leaderboard } from './types.ts';
import { chartRows } from '../lib/boards/transcribed-chart.ts';

const FEED = 'https://huggingface.co/tencent/Hy4-flash/resolve/main/assets/benchmark.png';
const board: Leaderboard = {
  benchmark: 'excel-fix-bench-tencent',
  static: 'paper',
  url: 'https://huggingface.co/tencent/Hy4-flash#appendix-benchmark-results',
  feed: FEED,
  terms: 'Tencent Hy License. https://huggingface.co/tencent/Hy4-flash/blob/main/LICENSE',
  async fetch() {
    return chartRows(FEED, '2aab42905fa871f41086bdbd474a7d850970b5614cd18e7eadb4656606ae113f', [
      { model: 'Hy4 flash', score: 15.6, trials: 3 },
      { model: 'Hy4', score: 27.8, trials: 3 },
      { model: 'Hy4 preview', score: 11.7, trials: 3 },
      { model: 'DeepSeek-V4.1-Flash-1017', score: 20.0, trials: 3 },
      { model: 'Qwen3.8-Flash-Next', score: 12.8, trials: 3 },
      { model: 'GLM-5.3-Flash', score: 9.9, trials: 3 },
      { model: 'GPT-6 Luna', score: 6.7, trials: 3 },
    ]);
  },
};
export default board;
