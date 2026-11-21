// MMGenre evaluates singing synthesis across ten musical genres.
// Table 1 reports SingMOS and three other quality measures, macro-averaged over the genres.
import type { Leaderboard } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2607.06986';
const board: Leaderboard = {
  benchmark: 'mmgenre', url: feed, feed, static: 'paper',
  terms: 'Paper and license details at https://arxiv.org/abs/2607.06986.',
  headline: 'The headline is SingMOS, the first whole-benchmark synthesis quality measure in Table 1.',
  async fetch() {
    const html = (await paperHtml(feed)).replace(/<cite\b[^>]*>[\s\S]*?<\/cite>/gi, '');
    const tables = paperTables(html).map(grid);
    const table = tables.find(t => t[0].join('|') === 'Model|SingMOS↑|SingPro↑|SSQA↑|CER↓');
    if (!table) throw new Error('Missing overall synthesis quality table');
    return checked(table.slice(1).map(([model, singmos, singpro, ssqa, cer]) => ({
      model, score: numberCell(singmos),
      metrics: { singMOSPro: numberCell(singpro), ssqa: numberCell(ssqa), cer: numberCell(cer) },
    })), 8);
  },
};
export default board;
