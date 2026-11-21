// BU Bench V2 scores browser agents on 60 tasks using weighted rubric credit after judge penalties, out of 100.
// Two independent transcriptions of the historical plot's printed scores and costs agreed.
// The SHA-256 guard requires a new transcription whenever the image changes.
import type { Leaderboard } from './types.ts';
import { chartRows } from '../lib/boards/transcribed-chart.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://raw.githubusercontent.com/browser-use/benchmark/HEAD/official_plots/bu_bench_v2_astra.jpg';
const board: Leaderboard = {
  benchmark: 'bu-bench-v2', url: 'https://github.com/browser-use/benchmark#benchmark-scores--historical-60-task-results', feed,
  terms: 'Browser Use publishes this figure in its benchmark repository. https://github.com/browser-use/benchmark',
  costPer: 'task',
  aliases: {
    'DS V4.1 Flash': 'deepseek-v4-1-flash', 'DS V4 Flash 0731': 'deepseek-v4-flash-0731', 'DS V4 Pro': 'deepseek-v4-pro',
    'Opus 5.5': 'claude-opus-5-5', 'Opus 5': 'claude-opus-5', 'Fable 5.1': 'claude-fable-5-1', 'Opus 4.8': 'claude-opus-4-8',
  },
  async fetch() {
    return checked(await chartRows(feed, '28a01bb35b25504428afc51beaf335c0cb063b5a0865771cc677457fc07427c3', [
      { model: 'GPT-6 Astra', setting: 'medium', score: 80.63, cost: 8.87 },
      { model: 'GPT-6 Sol', setting: 'medium', score: 66.85, cost: 1.20 },
      { model: 'Opus 5.5', score: 59.40, cost: 4.21 },
      { model: 'GPT-6 Luna', setting: 'xhigh', score: 57.55, cost: 0.190 },
      { model: 'Fable 5.1', setting: 'high', score: 56.23, cost: 8.11 },
      { model: 'GPT-6 Luna', setting: 'high', score: 53.95, cost: 0.155 },
      { model: 'Opus 5', score: 50.53, cost: 7.37 },
      { model: 'GPT-6 Luna', setting: 'medium', score: 50.30, cost: 0.126 },
      { model: 'GPT-5.6 Sol', setting: 'xhigh', score: 49.07, cost: 7.80 },
      { model: 'DS V4.1 Flash', setting: 'max', score: 47.88, cost: 0.263 },
      { model: 'DS V4.1 Flash', setting: 'high', score: 41.47, cost: 0.152 },
      { model: 'GPT-5.6 Luna', setting: 'xhigh', score: 41.17, cost: 0.358 },
      { model: 'GPT-6 Luna', setting: 'low', score: 40.68, cost: 0.018 },
      { model: 'Grok 4.7', setting: 'high', score: 39.93, cost: 5.72 },
      { model: 'GPT-5.6 Sol', setting: 'default', score: 38.45, cost: 2.71 },
      { model: 'DS V4.1 Flash', setting: 'low', score: 38.17, cost: 0.138 },
      { model: 'GLM 5.3 FlashX', setting: 'max', score: 38.12, cost: 0.628 },
      { model: 'MiMo V2.6 Flash', setting: 'think', score: 37.63, cost: 0.100 },
      { model: 'MiMo V2.6 Pro', setting: 'think', score: 37.07, cost: 0.233 },
      { model: 'Kimi K3', score: 36.60, cost: 4.12 },
      { model: 'GPT-5.5', score: 34.90, cost: 2.36 },
      { model: 'Qwen3.8 Max', score: 33.60, cost: 3.03 },
      { model: 'Grok 4.5', score: 33.03, cost: 1.15 },
      { model: 'GLM 5.3 Flash', setting: 'max', score: 32.33, cost: 0.543 },
      { model: 'GPT-6 Luna', setting: 'none', score: 31.75, cost: 0.077 },
      { model: 'GPT-5.6 Terra', score: 31.52, cost: 0.417 },
      { model: 'Grok 4.6', score: 31.18, cost: 3.93 },
      { model: 'DS V4.1 Flash', setting: 'none', score: 29.05, cost: 0.118 },
      { model: 'GLM 5.3', score: 28.05, cost: 2.81 },
      { model: 'GLM 5.3 Flash', setting: 'default', score: 28.03, cost: 0.114 },
      { model: 'GLM 5.2', score: 27.90, cost: 1.48 },
      { model: 'Opus 4.8', score: 27.20, cost: 4.27 },
      { model: 'DS V4 Pro', score: 23.43, cost: 1.01 },
      { model: 'DS V4 Flash 0731', score: 19.63, cost: 0.149 },
      { model: 'Qwen3.8 27B', score: 17.80, cost: 0.689 },
      { model: 'GPT-5.6 Luna', setting: 'default', score: 16.05, cost: 0.056 },
      { model: 'MiniMax M3', score: 11.82, cost: 0.883 },
      { model: 'Gemini 3.7 Flash', score: 9.58, cost: 0.998 },
      { model: 'Gemini 3.1 Pro', score: 6.88, cost: 0.965 },
      { model: 'Mercury 2.5', setting: 'diff.', score: 5.10, cost: 0.049 },
    ]), 40);
  },
};
export default board;
