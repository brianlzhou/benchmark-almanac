// RealHall evaluates hallucination detection methods on open- and closed-domain answers.
// The importer reads the paper's aggregate AUROC table, where higher AUROC is better.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const URL = 'https://arxiv.org/html/2310.18344';
const board: Leaderboard = {
  benchmark: 'realhall', static: 'paper', url: URL, feed: URL, terms: PAPER_TERMS,
  async fetch() {
    const table = paperTables(await paperHtml(URL)).map(grid).find((rows) => rows[0]?.join('|') === 'Metric|Aggregate AUROC');
    if (!table) throw new Error('RealHall aggregate AUROC table missing');
    const rows: LeaderboardRow[] = [];
    for (const cells of table.slice(1)) {
      const score = Number(cells[1]);
      if (!cells[0] || !Number.isFinite(score) || cells[0] === 'Random Guessing') continue;
      rows.push({ model: cells[0], score });
    }
    return checked(rows, 6);
  },
};
export default board;
