// RSICD tests image captioning on remote-sensing images.
// Table X reports METEOR and CIDEr for three trained models on three caption datasets.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/1712.07835';
const board: Leaderboard = {
  benchmark: 'rsicd', static: 'paper', url: feed, feed,
  terms: 'The authors publish the results in the arXiv paper. https://arxiv.org/abs/1712.07835',
  headline: 'The paper reports no overall score, so this is the CIDEr column, the primary captioning metric.',
  parts: { meteor: 'METEOR', cider: 'CIDEr' },
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t => t[0]?.join('|') === 'model|METEOR|CIDEr');
    if (!table) throw new Error('RSICD results table missing');
    const rows: LeaderboardRow[] = [];
    let setting = '';
    for (const row of table.slice(2)) {
      if (row[0]?.endsWith('dataset')) { setting = row[0]; continue; }
      if (row.length !== 3 || !/^\d+(?:\.\d+)?$/.test(row[1]) || !/^\d+(?:\.\d+)?$/.test(row[2])) throw new Error('Invalid RSICD row');
      rows.push({ model: row[0], setting, score: Number(row[2]), metrics: { meteor: Number(row[1]), cider: Number(row[2]) } });
    }
    return checked(rows, 9);
  },
};
export default board;
