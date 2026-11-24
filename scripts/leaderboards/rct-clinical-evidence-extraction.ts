// This benchmark tests whether a model extracts treatment effects from clinical trial abstracts.
// Table 2 gives end-to-end relation inference F1 and intermediate entity extraction metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2010.03550';
const board: Leaderboard = {
  benchmark: 'rct-clinical-evidence-extraction',
  url: feed,
  feed,
  static: 'paper',
  terms: 'The authors publish these results under the terms linked at https://arxiv.org/abs/2010.03550.',
  stats: { precision: { name: 'Relation precision', unit: '%' }, recall: { name: 'Relation recall', unit: '%' },
    entityP: { name: 'Entity extraction precision', unit: '%' }, entityR: { name: 'Entity extraction recall', unit: '%' },
    entityF1: { name: 'Entity extraction F1', unit: '%' } },
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const table = tables.find(table => table[0].join('|') === 'Relation Inference|P|R|F1');
    if (!table) throw new Error('Missing reviewed results columns');
    const rows: LeaderboardRow[] = [];
    for (const cells of table.slice(1)) {
      const [model, p, r, f1] = cells;
      const pct = (value: string) => Math.round(numberCell(value) * 10000) / 100;
      const metrics: Record<string, number> = { precision: pct(p), recall: pct(r) };
      const entities = tables.find(t => t[0].join('|') === 'Entity Extraction|P|R|F1');
      if (!entities) throw new Error('Missing intermediate entity metrics');
      const entity = entities.find(row => row[0] === model);
      if (entity) [metrics.entityP, metrics.entityR, metrics.entityF1] = entity.slice(1).map(pct);
      rows.push({model, score: pct(f1), metrics});
    }
    return checked(rows, 3);
  },
};
export default board;
