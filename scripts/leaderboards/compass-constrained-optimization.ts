// COMPASS tests constrained travel planning. Figure 2 reports the percentage of feasible plans
// and two optimality rates. Two independent transcriptions agreed on all 42 printed values.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { chartRows } from '../lib/boards/transcribed-chart.ts';

const feed = 'https://arxiv.org/html/2510.07043v2/solve_optimal_gap_new.png';
const board: Leaderboard = {
  benchmark: 'compass-constrained-optimization', static: 'paper', url: 'https://arxiv.org/html/2510.07043v2', feed,
  terms: 'The authors publish Figure 2 under the terms linked at https://arxiv.org/abs/2510.07043.',
  aliases: { 'C-Opus 4.6': 'claude-opus-4-6', 'C-Sonnet 4.6': 'claude-sonnet-4-6', 'C-Opus 4.1': 'claude-opus-4-1',
    'C-Opus 4': 'claude-opus-4', 'C-Sonnet 4': 'claude-sonnet-4' },
  stats: {
    top10: { name: 'Top-10% optimal rate', unit: '%', better: 'higher' },
    top5: { name: 'Top-5% optimal rate', unit: '%', better: 'higher' },
  },
  async fetch() {
    return checked(await chartRows(feed, 'fb9080f69ce07776677c15545d78b294289285ce87c38af6c92b142577b6e144', [
      { model: 'C-Opus 4.6', harness: 'Code Agent', score: 70, metrics: { top10: 62, top5: 61 } },
      { model: 'C-Sonnet 4.6', harness: 'Code Agent', score: 79, metrics: { top10: 66, top5: 60 } },
      { model: 'C-Opus 4.6', score: 78, metrics: { top10: 60, top5: 56 } },
      { model: 'GPT-5', score: 87, metrics: { top10: 58, top5: 51 } },
      { model: 'GPT-5.4', score: 74, metrics: { top10: 47, top5: 37 } },
      { model: 'C-Opus 4.1', score: 71, metrics: { top10: 45, top5: 36 } },
      { model: 'C-Opus 4', score: 71, metrics: { top10: 42, top5: 35 } },
      { model: 'Gemini 2.5 Pro', score: 56, metrics: { top10: 37, top5: 29 } },
      { model: 'C-Sonnet 4.6', score: 81, metrics: { top10: 57, top5: 54 } },
      { model: 'C-Sonnet 4', score: 69, metrics: { top10: 41, top5: 34 } },
      { model: 'Gemini 2.5 Flash', score: 51, metrics: { top10: 33, top5: 23 } },
      { model: 'Qwen3 14B', score: 38, metrics: { top10: 17, top5: 14 } },
      { model: 'Qwen3 32B', score: 33, metrics: { top10: 18, top5: 13 } },
      { model: 'Qwen3 8B', score: 24, metrics: { top10: 14, top5: 10 } },
    ]), 14);
  },
};
export default board;
