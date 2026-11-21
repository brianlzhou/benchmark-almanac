// RefuNQ tests whether language models answer answerable questions while refusing unknown questions.
// Table 1 reports answer accuracy on the RefuNQ answerable split and refusal rates on both splits.
import type { Leaderboard } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2311.09731';
const board: Leaderboard = {
  benchmark: 'refunq', static: 'paper', url: feed, feed,
  terms: 'The authors publish the results in the arXiv paper. https://arxiv.org/abs/2311.09731',
  parts: { answerableAccuracy: 'Answerable accuracy' },
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t => t[0]?.[0] === 'Metric' && t[1]?.[0] === 'Model');
    if (!table) throw new Error('RefuNQ results table missing');
    const rows = table.slice(2).map(row => {
      if (row.length !== 6 || !/^\d+(?:\.\d+)?$/.test(row[5])) throw new Error('Invalid RefuNQ row');
      const answerable = Number(row[5]);
      return { model: row[0].replace(/\*/g, ''), score: answerable, metrics: { answerableAccuracy: answerable } };
    });
    return checked(rows, 13);
  },
};
export default board;
