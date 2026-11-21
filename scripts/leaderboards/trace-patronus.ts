// TRACE tests how accurately a model detects reward hacking in coding trajectories.
// Figure 4 reports binary macro F1 (Detection Rate) and conditional multilabel macro F1 (Match Rate).
// We transcribed the bar labels twice and checked agreement. The PDF hash guards both chart panels.
import type { Leaderboard } from './types.ts';
import { chartRows } from '../lib/boards/transcribed-chart.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://raw.githubusercontent.com/mlresearch/v306/main/assets/deshpande26a/deshpande26a.pdf';
const rates: [string, number, number, number, number][] = [
  ['Claude Opus 4.5', 25, 61, 59, 71],
  ['GPT-5.2', 45, 63, 63, 75],
  ['Gemini-3-Pro', 35, 51, 61, 70],
  ['Kimi-K2-Thinking', 37, 55, 62, 68],
  ['GLM-4.7', 34, 52, 59, 65],
  ['DeepSeek-3.2', 35, 53, 58, 60],
];
const board: Leaderboard = {
  benchmark: 'trace-patronus', static: 'paper', feed, url: 'https://proceedings.mlr.press/v306/deshpande26a.html',
  terms: 'The published paper credits the authors and links its license. https://proceedings.mlr.press/v306/deshpande26a.html',
  aliases: {'DeepSeek-3.2': 'deepseek-v3-2'},
  async fetch() {
    const rows = rates.flatMap(([model, isolated, isolatedMatch, contrastive, contrastiveMatch]) => {
      const effort = model === 'GPT-5.2' ? ', high reasoning' : '';
      return [
        {model, setting: 'Isolated, N = 1' + effort, score: isolated, metrics: {matchRate: isolatedMatch}},
        {model, setting: 'Contrastive, N = 10' + effort, score: contrastive, metrics: {matchRate: contrastiveMatch}},
      ];
    });
    return checked(await chartRows(feed, 'c0da5d13ac62c1ed7ddc3e5c42d44d7314b1145a8cff7cf030295038b640dbcc', rows), 12);
  },
};
export default board;
