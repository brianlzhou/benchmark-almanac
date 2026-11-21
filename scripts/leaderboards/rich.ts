// RICH tests body and scene contact estimation from images and scans.
// Table 2 reports precision, recall, F1 and geometric error on RICH-test.
import type { Leaderboard } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2206.09553';
const board: Leaderboard = {
  benchmark: 'rich', static: 'paper', url: feed, feed,
  terms: 'The authors publish the results in the arXiv paper. https://arxiv.org/abs/2206.09553',
  headline: 'The paper reports no overall score, so this is the F1 column, which it ranks by.',
  parts: { precision: 'Precision', recall: 'Recall', f1: 'F1', geometricError: 'Geometric error' },
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t => t[0]?.[0] === 'Methods' && t[0]?.[3]?.includes('F1'));
    if (!table) throw new Error('RICH results table missing');
    const rows = table.slice(1).map(row => {
      if (row.length !== 5 || !row.slice(1, 4).every(v => /^\d+(?:\.\d+)?$/.test(v))) throw new Error('Invalid RICH row');
      const error = Number(row[4].replace('cm', '')); const metrics = { precision: Number(row[1]), recall: Number(row[2]), f1: Number(row[3]), geometricError: error };
      return { model: row[0].replace(/^[a-e]\. /, ''), score: metrics.f1, metrics };
    });
    return checked(rows, 5);
  },
};
export default board;
