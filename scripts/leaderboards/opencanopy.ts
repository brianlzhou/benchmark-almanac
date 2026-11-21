// OpenCanopy estimates tree canopy height from satellite images. Table 2 reports mean absolute
// height error in meters and four companion metrics for each backbone and pretraining dataset.
import type { Leaderboard } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://arxiv.org/html/2407.09392';
const board: Leaderboard = {
  benchmark: 'opencanopy', static: 'paper', url, feed: url,
  terms: 'The authors publish Table 2 under the paper terms at https://arxiv.org/abs/2407.09392.',
  parts: {
    nMAE: { name: 'Normalized mean absolute error', unit: '%', better: 'lower' },
    RMSE: { name: 'Root mean squared error', unit: 'score', note: 'Height error in meters.', better: 'lower' },
    treeCoverage: { name: 'Tree coverage IoU', unit: '%', better: 'higher' },
  },
  stats: { bias: { name: 'Height bias', unit: 'score', note: 'Mean signed canopy-height error in meters.' }
  },
  async fetch() {
    const table = flatPaperTables(await paperHtml(url)).map(grid).find(t => t[0]?.join('|') === 'Model|pretraining|MAE|nMAE|RMSE|Bias|Tree cov.');
    if (!table) throw new Error('Missing OpenCanopy height prediction table');
    return checked(table.slice(2).map(([label, training, mae, normalized, rmse, bias, iou]) => {
      const model = label.replace(/\s+(?:\d+\s+\d+\s+footnotemark:.*|\[.*)$/, '');
      const setting = 'Pretraining: '+training.replace(/\s*\[.*$/, '');
      const decimal = (s: string) => numberCell(s.replace(',', '.').replace(/^-\s+/, '-'));
      return { model, setting, score: decimal(mae), metrics: {
        nMAE: decimal(normalized), RMSE: decimal(rmse.replace(/^1\s+/, '')), bias: decimal(bias), treeCoverage: decimal(iou),
      } };
    }), 12);
  },
};
export default board;
