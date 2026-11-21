// ProSA measures prompt sensitivity, the variation in response quality across prompt templates.
// Table 2 reports PSS on two instruction-following benchmarks, where lower is better.
import type { Leaderboard } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2410.12405';
const board: Leaderboard = {
  benchmark: 'prosa', static: 'paper', url: feed, feed,
  terms: 'The authors publish the results in the arXiv paper. https://arxiv.org/abs/2410.12405',
  headline: 'The paper reports no overall score, so this is the plain mean of its two PSS benchmark parts.',
  parts: { alpaca: 'LC AlpacaEval 2.0', arena: 'Arena Hard Auto' },
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t => t[0]?.join('|') === 'Benchmarks|LC AlpacaEval 2.0|Arena Hard Auto');
    if (!table) throw new Error('ProSA results table missing');
    const rows = table.slice(2).map(row => {
      if (row.length !== 3 || !row.slice(1).every(v => /^\d+(?:\.\d+)?$/.test(v))) throw new Error('Invalid ProSA row');
      const metrics = { alpaca: Number(row[1]), arena: Number(row[2]) };
      return { model: row[0], score: (metrics.alpaca + metrics.arena) / 2, metrics };
    });
    return checked(rows, 5);
  },
};
export default board;
