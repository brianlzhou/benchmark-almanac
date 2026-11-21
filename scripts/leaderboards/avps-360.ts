// AVPS-360 tests segmentation and tracking of sound-producing people in panoramic recordings.
// Table 2 gives average precision (AP) first, followed by four tracking metrics for each audio encoder.
import type { Leaderboard } from './types.ts';
import { grid, paperTables, checked } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';

const url = 'https://arxiv.org/html/2610.40480';
const keys = ['AP','HOTA','DetA','AssA','IDF1'];
const board: Leaderboard = {
  benchmark: 'avps-360', static: 'paper', url, feed: url,
  terms: 'Author results published under the license listed at https://arxiv.org/abs/2610.40480.',
  parts: Object.fromEntries(keys.slice(1).map(name => [name,{name}])),
  async fetch() {
    const table = paperTables(await paperHtml(url)).map(grid).find(t => t[0]?.join('|') === ['Method','Audio Enc',...keys].join('|'));
    if (!table) throw new Error('Table 2 result columns missing');
    return checked(table.slice(1).filter(c => c[0] !== 'Ours').map(c => {
      if (c.length !== 7) throw new Error('Invalid AVPS-360 row');
      const metrics = Object.fromEntries(keys.map((key,i) => [key,numberCell(c[i+2])]));
      return { model: c[0], setting: c[1] === 'CNN–Conf.' ? 'CNN-Conformer audio encoder' : c[1] + ' audio encoder', score: metrics.AP, metrics };
    }),4);
  },
};
export default board;
