// WebShop tests agents on shopping instructions. Table 2 reports Task Score as 100 times mean reward.
// The authors also give reward components and the mean, maximum and minimum trajectory counts.
import type { Leaderboard } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2207.01206';
const parts = { attributes: 'Attributes', options: 'Options', type: 'Type', price: 'Price' };
const board: Leaderboard = {
  benchmark: 'webshop', feed, url: feed, static: 'paper', parts,
  terms: 'The authors publish the paper on arXiv. https://info.arxiv.org/help/license/index.html',
  stats: {
    states: { name: 'Mean states visited', unit: 'count' },
    statesMax: { name: 'Maximum states visited', unit: 'count' },
    statesMin: { name: 'Minimum states visited', unit: 'count' },
    items: { name: 'Mean items viewed', unit: 'count' },
    itemsMax: { name: 'Maximum items viewed', unit: 'count' },
    itemsMin: { name: 'Minimum items viewed', unit: 'count' },
    searches: { name: 'Mean searches', unit: 'count' },
    searchesMax: { name: 'Maximum searches', unit: 'count' },
    searchesMin: { name: 'Minimum searches', unit: 'count' },
  },
  async fetch() {
    const header = ['', 'All', 'Att', 'Opt', 'Type', 'Price', 'State', 'Item', 'Search'];
    const table = paperTables(await paperHtml(feed)).map(grid).find(t => header.every((h, i) => t[1]?.[i] === h));
    if (!table) throw new Error('Missing Task Score breakdown');
    return checked(table.slice(2).filter(([name]) => name !== 'Rule' && !name.startsWith('Human')).map(r => {
      if (!r.slice(1, 6).every(v => /^\d+\.\d+$/.test(v))) throw new Error('Invalid component scores for ' + r[0]);
      const metrics = Object.fromEntries(Object.keys(parts).map((key, i) => [key, Number(r[i + 2])]));
      ['states', 'items', 'searches'].forEach((key, i) => {
        const count = r[6 + i]?.match(/^([\d.]+) \(\s*(\d+) \/ (\d+)\)$/);
        if (!count) throw new Error('Invalid trajectory counts for ' + r[0]);
        metrics[key] = Number(count[1]);
        metrics[key + 'Max'] = Number(count[2]);
        metrics[key + 'Min'] = Number(count[3]);
      });
      return { model: r[0], score: Number(r[1]), trials: 3, metrics };
    }), 2);
  },
};
export default board;
