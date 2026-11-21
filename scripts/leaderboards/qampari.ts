// QAMPARI tests exhaustive multi-entity question answering over encyclopedic sources.
// The headline score is the paper's F1 percentage on the QAMParI test set.
// This importer reads Table 4 of the benchmark paper and keeps recall, precision and threshold rates.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const URL = 'https://arxiv.org/html/2205.12665';

const board: Leaderboard = {
  benchmark: 'qampari', static: 'paper', url: URL, feed: URL, terms: PAPER_TERMS,
  parts: { recall: { name: 'Recall', group: 'Metric', unit: '%' }, precision: { name: 'Precision', group: 'Metric', unit: '%' }, recallAt80: { name: '% Recall >= 0.8', group: 'Metric', unit: '%' }, f1At50: { name: '% F1 >= 0.5', group: 'Metric', unit: '%' } },
  async fetch() {
    const tables = paperTables(await paperHtml(URL)).map(grid);
    const table = tables.find((rows) => rows[0]?.includes('Rec.') && rows.some((row) => row[0] === 'FiD-BM25'));
    if (!table) throw new Error('QAMPARI Table 4 missing');
    const rows: LeaderboardRow[] = [];
    for (const cells of table.slice(1)) {
      const [model, setting, recall, precision, f1, recallAt80, f1At50] = cells;
      if (!model || !setting) continue;
      const values = [recall, precision, f1, recallAt80, f1At50].map(Number);
      if (values.some((value) => !Number.isFinite(value))) throw new Error(`QAMPARI invalid row: ${model}`);
      rows.push({ model, setting, score: values[2], metrics: { recall: values[0], precision: values[1], recallAt80: values[3], f1At50: values[4] } });
    }
    return checked(rows, 13);
  },
};

export default board;
