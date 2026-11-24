// TamperBench measures how well a model maintains safety after changes to its weights or representations.
// Figure 5 gives the maximum rubric-based StrongREJECT score across nine conditions. Lower is better.
// Two independent transcriptions, by row and by column, agreed on all 273 values. The image SHA-256 guards them.
import type { Leaderboard } from './types.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { chartRows } from '../lib/boards/transcribed-chart.ts';

const feed = 'https://arxiv.org/html/2602.06911v2/tamperbench_rubric_strongreject.png';
const hash = '91750c0b14dc0340af8eae75d99aaeacdf385092b883acc24cfd5c9cca89d8a0';
const labels = ['Untampered', 'Backdoor', 'Competing', 'Style', 'Malicious full FT', 'Malicious LoRA', 'Multilingual',
  'Malicious average', 'Benign full FT', 'Benign LoRA', 'Benign average', 'Embedding'];
// Percent of the full 0 to 1 score scale, followed by the published maximum in the final column.
const data: [string, number[]][] = [
  ['Qwen3-0.6B-Base', [33, 79, 77, 72, 75, 76, 74, 76, 35, 35, 35, 68, 79]],
  ['Qwen3-0.6B', [27, 65, 74, 69, 74, 66, 64, 69, 26, 24, 25, 67, 74]],
  ['Llama3.2-1B', [5, 73, 80, 73, 64, 76, 36, 67, 3, 7, 5, 63, 80]],
  ['Llama3.2-1B-Instruct', [36, 79, 85, 77, 78, 82, 83, 81, 34, 34, 34, 72, 85]],
  ['Qwen3-1.7B-Base', [32, 79, 84, 83, 82, 84, 85, 83, 43, 35, 39, 79, 85]],
  ['Qwen3-1.7B', [14, 72, 85, 76, 83, 80, 76, 79, 17, 15, 16, 82, 85]],
  ['Llama3.2-3B', [14, 81, 87, 85, 86, 83, 76, 83, 37, 41, 39, 68, 87]],
  ['Llama3.2-3B-Instruct', [22, 80, 90, 80, 85, 86, 88, 85, 41, 20, 31, 82, 90]],
  ['Qwen3-4B-Base', [20, 77, 88, 81, 89, 85, 85, 84, 46, 52, 49, 83, 89]],
  ['Qwen3-4B', [8, 73, 85, 75, 81, 56, 84, 76, 25, 35, 30, 45, 85]],
  ['Mistral-7B', [31, 83, 86, 82, 85, 83, 80, 83, 59, 59, 59, 70, 86]],
  ['Mistral-7B-Instruct', [64, 79, 85, 79, 90, 85, 85, 84, 75, 76, 75, 78, 90]],
  ['Qwen3-8B-Base', [11, 86, 89, 83, 83, 87, 79, 84, 22, 46, 34, 85, 89]],
  ['Qwen3-8B', [11, 85, 88, 84, 68, 88, 81, 82, 23, 39, 31, 37, 88]],
  ['Llama3-8B', [17, 82, 89, 80, 85, 86, 81, 84, 34, 34, 34, 63, 89]],
  ['Llama3-8B-Instruct', [23, 82, 87, 80, 88, 86, 87, 85, 44, 25, 35, 62, 88]],
  ['Llama3-8B-RR', [1, 84, 89, 80, 84, 86, 88, 85, 54, 39, 46, 37, 89]],
  ['Llama3-8B-ReFAT', [14, 82, 85, 80, 87, 86, 86, 84, 39, 34, 37, 34, 87]],
  ['Llama3-8B-CRL', [0, 86, 87, 84, 86, 85, 84, 85, 24, 28, 26, 7, 87]],
  ['Llama3-8B-LAT', [15, 81, 89, 86, 88, 89, 82, 86, 46, 35, 41, 62, 89]],
  ['Llama3-8B-TAR', [1, 76, 46, 9, 71, 75, 22, 50, 2, 11, 7, 18, 76]],
];
const board: Leaderboard = {
  benchmark: 'tamperbench-far-ai', static: 'paper', url: 'https://arxiv.org/html/2602.06911#S3.F5', feed,
  terms: 'The authors publish Figure 5 under the paper terms at https://arxiv.org/abs/2602.06911.',
  headline: 'The headline is the maximum StrongREJECT score across nine conditions, expressed as a percentage of the score scale.',
  parts: Object.fromEntries(labels.filter(k => k !== 'Untampered').map(k => [k, { name: k, better: 'lower' }])),
  stats: { Untampered: { name: 'Untampered', unit: '%', better: 'lower' } },
  async fetch() {
    const rows = data.map(([model, values]) => ({
      model, score: values[12], metrics: Object.fromEntries(labels.map((name, i) => [name, values[i]])),
    }));
    return checked(await chartRows(feed, hash, rows), 21);
  },
};
export default board;
