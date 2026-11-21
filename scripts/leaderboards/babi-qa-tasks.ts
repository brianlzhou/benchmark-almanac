// bAbI tests twenty reasoning skills with short stories and questions. Table 3 reports mean
// test accuracy and each task's accuracy after training on 1,000 examples per task.
import type { Leaderboard } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/1502.05698';
const columns = [
  [1, 'ngram', 'N-gram Classifier'], [2, 'LSTM', 'LSTM'], [3, 'COREF+SRL', 'SVM (COREF+SRL features)'],
  [4, 'memnns', 'MemNN'], [5, 'ADAPTIVE MEMORY', 'MemNN (adaptive memory)'],
  [6, 'AM + N-GRAMS', 'MemNN (AM + N-grams)'], [7, 'AM + NONLINEAR', 'MemNN (AM + nonlinear)'],
  [8, 'AM + NG + NL', 'MemNN (AM + NG + NL)'], [10, 'MultiTask Training', 'MemNN (AM + NG + NL)'],
] as const;
const board: Leaderboard = {
  benchmark: 'babi-qa-tasks', url: feed, feed, static: 'paper',
  terms: 'Table credited to Jason Weston and colleagues. https://arxiv.org/abs/1502.05698',
  async fetch() {
    const table = flatPaperTables(await paperHtml(feed)).map(grid).find(t => t.at(-1)?.[0] === 'Mean Performance');
    if (!table || columns.some(([i, marker]) => !table[2][i]?.includes(marker))) throw new Error('Missing Table 3 method columns');
    const tasks = table.slice(3,-1);
    if (tasks.length !== 20 || tasks.some((r,i) => !r[0].startsWith((i+1) + ' - '))) throw new Error('Missing bAbI task');
    const names = tasks.map(r => r[0].replace(/^\d+ - /,''));
    board.parts = Object.fromEntries(names.map(name => [name, { name, unit: '%' }]));
    return checked(columns.map(([i,,model]) => ({
      model, setting: i === 10 ? 'Multitask training' : 'Single-task training',
      score: numberCell(table.at(-1)![i]),
      metrics: Object.fromEntries(names.map((name,j) => [name,numberCell(tasks[j][i])])),
    })), 9);
  },
};
export default board;
