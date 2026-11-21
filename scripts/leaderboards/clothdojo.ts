// ClothDojo benchmarks bimanual garment flattening and folding with closed-loop policy models.
// The source reports no overall score. The headline is the plain mean of the flatten and fold task averages, computed by this importer.
// The importer reads Table VI in the benchmark paper.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://arxiv.org/html/2611.01190';
const board: Leaderboard = {
  benchmark: 'clothdojo', static: 'paper', url: 'https://clothdojo.github.io/#leaderboard', feed: FEED,
  terms: PAPER_TERMS,
  headline: 'The source reports no overall score, so this is the plain mean of the flatten and fold task averages.',
  parts: {
    flatten: { name: 'Flatten', group: 'Task', unit: '%' },
    fold: { name: 'Fold', group: 'Task', unit: '%' },
  },
  async fetch() {
    const tables = paperTables(await paperHtml(FEED)).map(grid);
    const table = tables[6];
    if (!table || table.length < 6) throw new Error('ClothDojo Table VI missing');
    const rows: LeaderboardRow[] = [];
    let task = '';
    for (const row of table) {
      if (row[0] === 'Flatten' || row[0] === 'Fold') task = row[0];
      const model = row[1];
      const avg = Number(row[6]);
      if (!task || !model || !Number.isFinite(avg) || model === 'Method') continue;
      const existing = rows.find((r) => r.model === model);
      if (!existing) rows.push({ model, score: 0, metrics: {} });
      const target = rows.find((r) => r.model === model)!;
      target.metrics![task === 'Flatten' ? 'flatten' : 'fold'] = avg;
    }
    for (const row of rows) {
      const flatten = row.metrics!.flatten;
      const fold = row.metrics!.fold;
      if (!Number.isFinite(flatten) || !Number.isFinite(fold)) continue;
      row.score = Number(((flatten + fold) / 2).toFixed(4));
    }
    const complete = rows.filter((r) => Number.isFinite(r.score) && r.metrics?.flatten !== undefined && r.metrics?.fold !== undefined);
    return checked(complete, 2);
  },
};
export default board;
