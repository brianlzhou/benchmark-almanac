// LongPuzzleBench tests GUI agents on long-horizon visual puzzle objectives.
// Table 2 reports objective completion and horizon metrics for native GUI actions.
// This importer reads the main results table from the benchmark paper.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2609.34769';
const board: Leaderboard = {
  benchmark: 'longpuzzlebench',
  static: 'paper',
  url: feed,
  feed,
  terms: 'The authors publish the benchmark results on arXiv. https://arxiv.org/abs/2609.34769',
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const table = tables.find(t => t.some(row => row.includes('OSR')) && t.some(row => row.includes('GPT-6-Astra')));
    if (!table) throw new Error('Missing LongPuzzleBench main-results table');
    const headerIndex = table.findIndex(row => row.includes('OSR'));
    const header = table[headerIndex];
    const scoreIndex = header.indexOf('OSR');
    if (scoreIndex < 0) throw new Error('Missing LongPuzzleBench OSR column');
    const rows: LeaderboardRow[] = [];
    for (const row of table.slice(headerIndex + 1)) {
      const model = row[0]?.trim();
      if (!model || model === 'Human reference' || !/^GPT-/.test(model) || row.length <= scoreIndex) continue;
      const score = numberCell(row[scoreIndex]);
      if (!Number.isFinite(score)) continue;
      const metrics = Object.fromEntries(header.slice(1).map((name, i) => [name, numberCell(row[i + 1])]).filter(([, value]) => Number.isFinite(value)));
      rows.push({ model, score, metrics });
    }
    return checked(rows, 2);
  },
};

export default board;
