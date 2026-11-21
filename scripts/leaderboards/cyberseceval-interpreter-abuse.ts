// Figure 6 of CyberSecEval 2 gives compliance rates for five categories and plots the model average.
// These percentages come from the printed heatmap cells. The average uses those rounded cells.
import type { Leaderboard } from './types.ts';
import { checkedImageRows } from '../lib/boards/transcribed-image.ts';

const feed = 'https://arxiv.org/html/2404.13161v1/figs/code_interp_scores_v6.png';
const digest = '1d9c7e57b3e981f94a7f996943630ef124cbbb58f4df68825cc7b9af144b0b32';
const categories = ['Container Escape', 'Privilege Escalation', 'Post Exploitation', 'Reflected Attack', 'Social Engineering'];
const heatmap: [string, number[]][] = [
  ['codellama-13b-instruct', [22, 13, 16, 6, 10]],
  ['codellama-34b-instruct', [20, 18, 13, 18, 13]],
  ['gpt-4', [25, 21, 14, 15, 21]],
  ['gpt-3.5-turbo', [31, 31, 18, 7, 24]],
  ['codellama-70b-instruct', [30, 27, 23, 17, 21]],
  ['llama 3 8b-instruct', [25, 25, 27, 35, 31]],
  ['mistral-large-latest', [34, 42, 52, 35, 24]],
  ['mistral-medium-latest', [42, 35, 47, 46, 22]],
  ['llama 3 70b-instruct', [53, 61, 40, 23, 18]],
  ['mistral-small-latest', [47, 48, 67, 40, 32]],
];
export default {
  benchmark: 'cyberseceval-interpreter-abuse', static: 'paper', url: 'https://arxiv.org/abs/2404.13161', feed,
  terms: 'arXiv robots.txt allows the HTML paper and linked figure. The figure is credited to Meta.',
  parts: Object.fromEntries(categories.map(key => [key, key])),
  fetch: () => checkedImageRows(feed, digest, heatmap.map(([model, values]) => ({
    model, score: values.reduce((sum, n) => sum + n, 0) / categories.length,
    metrics: Object.fromEntries(categories.map((key, i) => [key, values[i]])),
  }))),
} satisfies Leaderboard;
