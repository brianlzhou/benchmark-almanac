// LARY evaluates latent action representations for semantic classification and robot action regression.
// The project's first ranking uses average classification accuracy. The second reports mean squared error.
import type { Leaderboard, BoardPart } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';
import { grid, checked } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';
const feed = 'https://meituan-longcat.github.io/LARYBench/';
const datasets = ['CALVIN', 'VLABench', 'RoboCOIN', 'AgiBotWorld'];
const regression = (name: string): BoardPart => ({ name, unit: 'score', better: 'lower', note: 'Mean squared error on action regression.' });
const board: Leaderboard = {
  benchmark: 'larybench', feed, url: feed + '#leaderboard',
  terms: 'The repository uses the MIT license at https://github.com/meituan-longcat/LARYBench/blob/main/LICENSE.',
  headline: 'The headline is average classification accuracy. The board scores action regression separately with mean squared error.',
  parts: { human: {name: 'Comp. Human', unit: '%'}, robot: {name: 'Comp. Robot', unit: '%'}, mse: regression('Regression'),
    ...Object.fromEntries(datasets.map(key => [key, regression(key)])) },
  async fetch() {
    const data = tables(await fetchText(feed)).map(grid);
    const cls = data.find(t => t[0].join('|') === 'Rank|Model|Paradigm|Params|Avg. Acc ↑|Comp. Human|Comp. Robot');
    const reg = data.find(t => t[0].join('|') === 'Rank|Model|Paradigm|Params|Avg. MSE ↓|' + datasets.join('|'));
    if (!cls || !reg) throw new Error('Missing classification or regression leaderboard');
    const rows = cls.slice(1).map(([, model, , size, accuracy, human, robot]) => {
      const row = reg.find(r => r[1] === model);
      if (!row || !size.endsWith('M')) throw new Error('Missing regression or model size for ' + model);
      return { model, score: numberCell(accuracy), params: numberCell(size.slice(0, -1)) / 1000,
        metrics: { human: numberCell(human), robot: numberCell(robot), mse: numberCell(row[4]),
          ...Object.fromEntries(datasets.map((key, i) => [key, numberCell(row[5 + i])])) } };
    });
    return checked(rows, 11);
  },
};
export default board;
