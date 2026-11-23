// LAD2000 evaluates video anomaly detection with frame-level AUC. Table 3 reports each method's AUC on the LAD
// dataset in its last column, and on four older datasets before it. The authors ran every method on LAD with its
// public code (the asterisks). "Our Method" is the paper's own model, which has no name, so it stays out. The first
// version of this importer searched the page text with double-escaped patterns and never matched (fixed
// 2026-11-23).
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2106.08570';
const board: Leaderboard = {
  benchmark: 'lad2000', url: feed, feed, static: 'paper',
  terms: 'The authors publish the results on arXiv. ' + feed.replace('/html/', '/abs/'),
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t => t[0]?.at(-1) === 'LAD' && t.some(r => r[0]?.startsWith('ConvAE')));
    if (!table) throw new Error('Missing LAD2000 Table 3');
    const rows: LeaderboardRow[] = [];
    for (const r of table.slice(1)) {
      const name = r[0]?.replace(/\s*\[\s*\d+\s*\]$/, '').trim();
      if (!name || name === 'Our Method') continue;
      rows.push({ model: name, score: numberCell(r.at(-1)!.replace(/\*$/, '')) });
    }
    return checked(rows, 10);
  },
};
export default board;
