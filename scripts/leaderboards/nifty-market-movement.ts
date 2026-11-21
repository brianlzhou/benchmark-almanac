// NIFTY tests prediction of stock market movements. Tables 5 and 6 report test accuracy
// for two base experts and their dataset-specific LoRA models, together with F1, precision, and recall.
import type { Leaderboard } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, flatPaperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2405.09747';
const board: Leaderboard = {
  benchmark: 'nifty-market-movement', url: feed, feed, static: 'paper',
  terms: 'Paper and license details at https://arxiv.org/abs/2405.09747.',
  async fetch() {
    const html = (await paperHtml(feed)).replace(/<cite\b[^>]*>[\s\S]*?<\/cite>/gi, '');
    const tables = flatPaperTables(html).map(grid);
    const results = tables.filter(t => t[0][1] === 'Base Expert' && t[0][2].includes('LORA Adapters'));
    if (results.length !== 2) throw new Error('Missing NIFTY expert comparison');
    const rows = results.flatMap(t => {
      if (t.slice(2).map(r => r[0]).join() !== 'F1 Score,Accuracy,Precision,Recall') throw new Error('Missing NIFTY metrics');
      return t[1].slice(1).map((model, i) => {
        const col = i + 1;
        return { model, score: numberCell(t[3][col]) * 100,
          metrics: { f1: numberCell(t[2][col]), precision: numberCell(t[4][col]), recall: numberCell(t[5][col]) } };
      });
    });
    return checked(rows, 10);
  },
};
export default board;
