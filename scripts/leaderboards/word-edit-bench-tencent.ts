// WordEditBench tests Word document editing across four real-world scenarios.
// The score is the rule-based checker score on 100 tasks, where requested edits earn points and collateral edits lose points.
// Results are transcribed twice from Tencent's appendix chart on 2026-11-20.
// Image: https://huggingface.co/tencent/Hy4-flash/resolve/main/assets/benchmark.png
// SHA-256: 2aab42905fa871f41086bdbd474a7d850970b5614cd18e7eadb4656606ae113f
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { chartRows } from '../lib/boards/transcribed-chart.ts';
const FEED = 'https://huggingface.co/tencent/Hy4-flash/resolve/main/assets/benchmark.png (transcribed 2026-11-20)';
const board: Leaderboard = {
  benchmark: 'word-edit-bench-tencent',
  static: 'paper',
  url: 'https://huggingface.co/tencent/Hy4-flash',
  feed: FEED,
  terms: 'Public results in the Tencent Hugging Face model card. Attribution and source licensing apply.',
  async fetch(): Promise<LeaderboardRow[]> {
    return checked(await chartRows('https://huggingface.co/tencent/Hy4-flash/resolve/main/assets/benchmark.png', '2aab42905fa871f41086bdbd474a7d850970b5614cd18e7eadb4656606ae113f', [
      { model: 'Hy4 flash', score: 46.2, setting: 'highest available reasoning' },
      { model: 'Hy4', score: 57.2, setting: 'highest available reasoning' },
      { model: 'Hy4 preview', score: 44.2, setting: 'highest available reasoning' },
      { model: 'DeepSeek-V4.1-Flash-1017', score: 53.5, setting: 'highest available reasoning' },
      { model: 'Qwen3.8-Flash-Next', score: 46.3, setting: 'highest available reasoning' },
      { model: 'GLM-5.3-Flash', score: 47.6, setting: 'highest available reasoning' },
      { model: 'GPT-6 Luna', score: 42.7, setting: 'highest available reasoning' },
    ]));
  },
};
export default board;
