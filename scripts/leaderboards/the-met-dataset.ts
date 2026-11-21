// The Met Dataset tests instance-level artwork recognition from visitor photographs.
// The headline is ACC on Met queries, the first primary metric in the makers' evaluation page.
// This importer reads the comparative results table in the benchmark paper and keeps GAP metrics beside ACC.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2202.01747';
const board: Leaderboard = {
  benchmark: 'the-met-dataset',
  url: 'http://cmp.felk.cvut.cz/met/',
  feed,
  static: 'paper',
  headline: 'The paper reports ACC on Met queries alongside GAP measures, so ACC is the headline score.',
  terms: PAPER_TERMS,
  async fetch() {
    const tables = (await paperTables(await paperHtml(feed))).map(grid);
    const table = tables.find(rows => JSON.stringify(rows[0]) === '["Net","GAP","GAP -","ACC"]');
    if (!table) throw new Error('Missing The Met comparative results table');
    const rows: LeaderboardRow[] = [];
    for (const cells of table.slice(1)) {
      const model = cells[0]?.replace(/\s+\[[^\]]+\]$/, '').trim();
      const gap = Number(cells[1]?.match(/^\d+(?:\.\d+)?/)?.[0]);
      const gapMinus = Number(cells[2]?.match(/^\d+(?:\.\d+)?/)?.[0]);
      const acc = Number(cells[3]?.match(/^\d+(?:\.\d+)?/)?.[0]);
      if (!model || ![gap, gapMinus, acc].every(Number.isFinite)) continue;
      rows.push({ model, score: acc, metrics: { GAP: gap, 'GAP -': gapMinus } });
    }
    if (rows.length !== 10) throw new Error(`Expected ten Met comparative rows, got ${rows.length}`);
    return rows;
  },
};
export default board;
