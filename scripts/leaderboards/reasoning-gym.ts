// Reasoning Gym evaluates procedural reasoning across generated task categories.
// Table 1 reports Acc@3 for five categories for the baseline and its trained variant.
import type { Leaderboard } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2505.24760';
const board: Leaderboard = {
  benchmark: 'reasoning-gym', static: 'paper', url: feed, feed,
  terms: 'The authors publish the results in the arXiv paper. https://arxiv.org/abs/2505.24760',
  headline: 'The paper reports no overall score, so this is the plain mean of its five category Acc@3 scores.',
  parts: { algebra: 'Algebra', algorithmic: 'Algorithmic', arithmetic: 'Arithmetic', cognition: 'Cognition', games: 'Games' },
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t => t[0]?.join('|') === '|Algebra|Algorithmic|Arithmetic|Cognition|Games');
    if (!table) throw new Error('Reasoning Gym results table missing');
    const rows = table.slice(1).map(row => {
      if (row.length !== 6) throw new Error('Invalid Reasoning Gym row');
      const values = row.slice(1).map(v => Number(v.match(/^\d+(?:\.\d+)?/)?.[0] ?? NaN));
      if (!values.every(Number.isFinite)) throw new Error('Invalid Reasoning Gym score');
      const metrics = { algebra: values[0], algorithmic: values[1], arithmetic: values[2], cognition: values[3], games: values[4] };
      return { model: row[0], setting: row[0] === 'Baseline' ? 'Baseline' : 'RG-RLVR', score: values.reduce((a, b) => a + b, 0) / values.length, metrics };
    });
    return checked(rows, 2);
  },
};
export default board;
