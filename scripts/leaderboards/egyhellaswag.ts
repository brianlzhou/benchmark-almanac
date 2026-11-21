// EgyHellaSwag tests commonsense sentence completion in Egyptian Arabic.
// Tables 1 and D.1 report accuracy for zero-shot and three-shot prompts.
import type { Leaderboard } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2505.18383';
export default {
  benchmark:'egyhellaswag', url: feed, feed, static:'paper',
  terms:'Paper and license at https://arxiv.org/abs/2505.18383',
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const rows = ['Zero-shot','Three-shot'].flatMap((setting,i) => {
      const table = tables.find(t => t[0][4] === 'HellaSwag' && t[1]?.[4] === 'EGY'
        && t[0].length === (i === 0 ? 10 : 8) && (i !== 0 || t[0][8] === 'Palm'));
      if (!table) throw new Error('Missing Egyptian HellaSwag ' + setting + ' results');
      return checked(table.slice(2).map(c => ({model:c[1], score:numberCell(c[4]), setting})),16);
    });
    return checked(rows,32);
  },
} satisfies Leaderboard;
