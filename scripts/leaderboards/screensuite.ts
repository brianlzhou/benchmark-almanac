// ScreenSuite evaluates GUI models on perception, single-step and multi-step tasks.
// The source reports no overall score, so this importer uses the plain mean of its 12 benchmark scores.
// Rows with missing benchmark values are omitted, and the source comparison chart is guarded by its SHA-256.
import type { Leaderboard } from './types.ts';
import { chartRows } from '../lib/boards/transcribed-chart.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const URL = 'https://github.com/user-attachments/assets/0bb1563f-6b09-4df4-883a-01c7adc23556';
const names = ['ScreenQA-Complex', 'ScreenQA-Short', 'ScreenSpot-v2', 'ScreenSpot-Pro', 'VisualWebBench', 'WebSRC (F1)', 'Showdown-Clicks', 'Android Control', 'Multimodal Mind2Web', 'AndroidWorld', 'OSWorld', 'GAIA-Web'];
const values: [string, number[]][] = [
  ['Qwen2.5-VL-72B', [75.3, 79.6, 93.3, 55.6, 72.6, 94.7, 41.0, 66.6, 50.3, 24.4, 12.8, 5.5]],
  ['Qwen2.5-VL-32B', [74.5, 85.7, 85.6, 44.0, 63.1, 92.3, 48.0, 47.4, 46.8, 15.2, 7.8, 3.3]],
  ['GPT-4o', [43.1, 86.4, 19.8, 1.0, 74.2, 92.3, 4.6, 48.2, 1.6, 6.8, 3.7, 6.6]],
];

const board: Leaderboard = {
  benchmark: 'screensuite', static: 'paper', url: URL, feed: `${URL} (transcribed 2026-11-20)`,
  terms: 'The ScreenSuite repository is Apache 2.0 licensed. https://github.com/huggingface/screensuite',
  headline: 'The source reports no overall score, so this is the plain mean of its 12 benchmark scores.',
  parts: Object.fromEntries(names.map((name) => [name, { name, group: 'Benchmark', unit: '%' }])),
  async fetch() {
    const rows = values.map(([model, scores]) => ({ model, score: scores.reduce((sum, value) => sum + value, 0) / scores.length, metrics: Object.fromEntries(names.map((name, index) => [name, scores[index]])) }));
    return checked(await chartRows(URL, '840ff0ed9d706d420b30dd09d0438667475cc4636983633c3960014f5165383c', rows), 3);
  },
};

export default board;
