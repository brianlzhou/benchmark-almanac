// JudgmentBench asks evaluators to identify the higher-quality legal work product.
// Table 10 reports task-averaged win rates for two evaluation protocols.
// Rubric ties count as half a win. Convert proportions to percentages.
import type { Leaderboard } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2605.25240';
export default {
  benchmark: 'judgmentbench', url: feed, feed, static: 'paper',
  terms: 'Paper and license at https://arxiv.org/abs/2605.25240',
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t =>
      t[0].join('|') === String.raw`Evaluator|\bar{W}^{CJ}|\bar{W}^{rub}|\widehat{D}_{W}`);
    if (!table) throw new Error('Missing expanded autograder results');
    return checked(table.slice(1).filter(row => row[0] !== 'Human').flatMap(([model, cj, rubric, difference]) => {
      if (![cj, rubric, difference].every(v => /^-?\d+\.\d+$/.test(v))) throw new Error('Invalid autograder win rate');
      const metrics = {protocolDifference: 100 * Number(difference)};
      return [{model, setting: 'Comparative judgment', score: 100 * Number(cj), metrics},
        {model, setting: 'Rubric scoring', score: 100 * Number(rubric), metrics}];
    }), 16);
  },
} satisfies Leaderboard;
