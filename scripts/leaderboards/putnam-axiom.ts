// Putnam-AXIOM tests language models on Putnam competition problems.
// Table 1 reports the percentage of questions solved and TFA, a next-token prediction proxy.
import type { Leaderboard } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2508.08292';
const board: Leaderboard = {
  benchmark: 'putnam-axiom', static: 'paper', url: feed, feed,
  terms: 'The authors publish the results in the arXiv paper. https://arxiv.org/abs/2508.08292',
  parts: { tfa: 'TFA' },
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t => t[0]?.join('|') === 'Model|Score|%|TFA');
    if (!table) throw new Error('Putnam-AXIOM results table missing');
    const rows = table.slice(1).map(row => {
      if (row.length !== 4 || !/^\d+(?:\.\d+)?$/.test(row[2])) throw new Error('Invalid Putnam-AXIOM row');
      const metrics: Record<string, number> = {};
      if (/^\d+(?:\.\d+)?$/.test(row[3])) metrics.tfa = Number(row[3]);
      return { model: row[0], score: Number(row[2]), metrics };
    });
    return checked(rows, 18);
  },
};
export default board;
