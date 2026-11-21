// FQuAD evaluates French extractive question answering.
// The headline is test-set F1 from Table 11 of the benchmark paper. Exact match stays in metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://arxiv.org/html/2002.06071';
const board: Leaderboard = {
  stats: { exactMatch: { name: 'Exact match', unit: '%', better: 'higher' }, devF1: { name: 'Development F1', unit: '%', better: 'higher' }, devExactMatch: { name: 'Development exact match', unit: '%', better: 'higher' } },
  benchmark: 'fquad', static: 'paper',
  url: 'https://arxiv.org/abs/2002.06071', feed: FEED,
  terms: 'The authors publish the paper under the arXiv terms of use. https://arxiv.org/abs/2002.06071',
  async fetch(): Promise<LeaderboardRow[]> {
    const tables = paperTables(await paperHtml(FEED)).map(grid);
    const table = tables.find((t) => t[0]?.[1] === 'FQuAD1.1-test' && t[1]?.[1] === 'F1');
    if (!table) throw new Error('FQuAD results table missing');
    const rows = table.slice(2).filter((row) => row[0] !== 'Human Perf.').map((row) => ({
      model: row[0], score: Number(row[1]), metrics: { exactMatch: Number(row[2]), devF1: Number(row[3]), devExactMatch: Number(row[4]) },
    }));
    return checked(rows, 5);
  },
};
export default board;
