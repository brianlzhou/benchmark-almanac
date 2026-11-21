// The source reports no overall score. The headline is the plain mean of the 5 parts, computed by this importer.
// Table 2 measures root mean square error when predicting five plant traits from gene expression.
import type { Leaderboard } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, flatPaperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2606.27413';
const traits = ['Leaf Area', 'Inflorescence Height', 'qL', 'FvP/FmP', 'LTD'];
const board: Leaderboard = {
  benchmark: 'graft', url: feed, feed, static: 'paper',
  terms: 'The authors publish Table 2 under the terms linked at https://arxiv.org/abs/2606.27413.',
  headline: 'The paper reports no overall score, so this is the plain mean of root mean square error across five traits.',
  parts: Object.fromEntries(traits.map(name => [name, name])),
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const table = tables.find(t => t[0]?.[1]?.includes('rMSE') && t[1]?.join('|') === ['Backbone', ...traits].join('|'));
    if (!table) throw new Error('Missing GRAFT Table 2');
    const rows = table.slice(2).map(row => {
      const model = row[0].replace(/\s+(?:\S+ et al\.|Huang and Yang)\s*\(\d{4}\)$/, '');
      const metrics: Record<string, number> = {};
      for (const [i, trait] of traits.entries()) {
        const cell = row[i + 1].match(/^(\d+\.\d+)\s*\\pm\s*(\d+\.\d+)$/);
        if (!cell) throw new Error('Unexpected GRAFT mean or variance');
        metrics[trait] = Number(cell[1]);
        metrics[trait + ' variance'] = Number(cell[2]);
      }
      const score = traits.reduce((sum, trait) => sum + metrics[trait], 0) / traits.length;
      return { model, score, metrics, trials: 3 };
    });
    return checked(rows, 7);
  },
};
export default board;
