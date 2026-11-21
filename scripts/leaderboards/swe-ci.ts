// SWE-CI tests sustained codebase maintenance. The authors plot EvoScore at gamma = 1 without numeric point labels.
// Two readings of the plotted points, checked against the vertical axis, agreed to the nearest percentage point.
// The SHA-256 guards the image used for both readings.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { chartRows } from '../lib/boards/transcribed-chart.ts';

const feed = 'https://raw.githubusercontent.com/SKYLENAGE-AI/SWE-CI/HEAD/docs/result.png';
const board: Leaderboard = {
  benchmark: 'swe-ci', url: 'https://github.com/SKYLENAGE-AI/SWE-CI#leaderboard', feed,
  terms: 'The makers publish the benchmark under Apache 2.0. https://huggingface.co/datasets/skylenage-ai/SWE-CI',
  headline: 'EvoScore at gamma = 1, read from the leaderboard chart to the nearest percentage point.',
  aliases: { 'QWen3-Max-2026-01-23': 'qwen3-max-jan-2026' },
  async fetch() {
    const scores: Record<string, number> = {
      'QWen3-coder-plus': 24, 'QWen3-Max-2025-09-23': 31, 'QWen3-Max-2026-01-23': 32, 'QWen3.5-plus': 60,
      'Kimi-K2-Instruct-0905': 38, 'Kimi-K2-thinking': 39, 'Kimi-K2.5': 47,
      'GLM-4.6': 38, 'GLM-4.7': 48, 'GLM-5': 71, 'MiniMax-M2.1': 37, 'MiniMax-M2.5': 59,
      'Claude-Opus4.5': 71, 'Claude-Opus4.6': 92, 'DeepSeek-V3.2': 49, 'GPT-5.2': 44,
      'doubao-seed-1-8-251228': 27, 'doubao-seed-2-0-pro-260215': 29,
    };
    return checked(await chartRows(feed, '5b6c9d87bfa5899d2f9d2c5ee9ab25ae006e3d7d0f026e2607dbb0aa288a3707',
      Object.entries(scores).map(([model, score]) => ({ model, score }))), 18);
  },
};
export default board;
