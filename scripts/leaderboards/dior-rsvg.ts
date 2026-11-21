// DIOR-RSVG tests whether a model can locate a described object in a remote sensing image.
// Table II reports the percentage of test predictions with at least 0.5 bounding-box overlap.
import type { Leaderboard } from './types.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2210.12634';
const board: Leaderboard = {
  benchmark: 'dior-rsvg',
  stats: { 'Pr@0.6': { name: 'Precision at IoU 0.6', unit: '%', better: 'higher' }, 'Pr@0.7': { name: 'Precision at IoU 0.7', unit: '%', better: 'higher' }, 'Pr@0.8': { name: 'Precision at IoU 0.8', unit: '%', better: 'higher' }, 'Pr@0.9': { name: 'Precision at IoU 0.9', unit: '%', better: 'higher' }, meanIoU: { name: 'Mean intersection over union', unit: '%', better: 'higher' }, cumIoU: { name: 'Cumulative intersection over union', unit: '%', better: 'higher' } },
  url: 'https://github.com/ZhanYang-nwpu/RSVG-pytorch',
  feed,
  static: 'paper',
  terms: 'The authors publish Table II under the terms at https://arxiv.org/abs/2210.12634.',
  async fetch() {
    const header = ['Methods', 'Venue', 'Visual Encoder', 'Language Encoder', 'Pr@0.5',
      'Pr@0.6', 'Pr@0.7', 'Pr@0.8', 'Pr@0.9', 'meanIoU', 'cumIoU'];
    const table = flatPaperTables(await paperHtml(feed)).map(grid)
      .find(([cells]) => JSON.stringify(cells) === JSON.stringify(header));
    if (!table) throw new Error('DIOR-RSVG Table II columns changed');
    const rows = table.slice(1).filter(cells => !cells[0].endsWith(':')).map(cells => ({
      model: cells[0] === 'Ours' ? 'MGVLF' : cells[0],
      setting: cells[2] + ' + ' + cells[3],
      score: numberCell(cells[4]),
      metrics: Object.fromEntries(header.slice(5).map((name, i) => [name, numberCell(cells[5 + i])])),
    }));
    return checked(rows, 12);
  },
};
export default board;
