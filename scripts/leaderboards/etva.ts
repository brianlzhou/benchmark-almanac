// ETVA measures whether generated videos satisfy atomic questions about the prompt.
// Table 6 gives the full 2,000-prompt average and ten alignment categories.
import type { Leaderboard } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';

const feed = 'https://arxiv.org/html/2503.16867';
const categories = ['Existence','Motion','Material','Spatial','Number','Shape','Color','Camera','Physics','Other'];
const board: Leaderboard = {
  benchmark: 'etva', static: 'paper', url: feed, feed,
  terms: 'Paper license: https://arxiv.org/abs/2503.16867',
  parts: Object.fromEntries(categories.map(c => [c, c])),
  aliases: { 'Mochi-1-preview': 'mochi-v1' },
  async fetch() {
    const header = ['Model', ...categories, 'Avg'];
    const table = inlinePaperTables(await paperHtml(feed)).find(t => t[0].join('|') === header.join('|'));
    if (!table) throw new Error('Missing ETVABench-2k Table 6');
    const rows = table.slice(1).filter(r => r[0] !== 'Open-Source T2V Models').map(([model, ...cells]) => {
      if (cells.length !== 11 || cells.some(v => !/^\d+\.\d+$/.test(v))) throw new Error('Invalid ETVA row');
      return { model, score: Number(cells[10]), metrics: Object.fromEntries(categories.map((c,i) => [c, Number(cells[i])])) };
    });
    return checked(rows, 10);
  },
};
export default board;
