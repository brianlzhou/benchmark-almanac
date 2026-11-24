// The source reports no overall score. The headline is the plain mean of the 8 parts, computed by this importer.
// Table 3 scores five Helium sequential checkpoint and merge variants on the 2018 to 2025 cloze evaluation.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2605.22769';
const board: Leaderboard = {
  benchmark: 'kairosqa',
  url: feed,
  feed,
  static: 'paper',
  terms: 'The authors publish these results under the terms linked at https://arxiv.org/abs/2605.22769.',
  headline: 'Table 3 reports no overall score, so this is the plain mean of its eight yearly cloze accuracies from 2018 to 2025.',
  parts: Object.fromEntries(Array.from({ length: 8 }, (_, i) => [String(2018 + i), String(2018 + i)])),
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const table = tables.find(table => table[0].join('|') === 'Model|Soup Coefficients|2018|2019|2020|2021|2022|2023|2024|2025');
    if (!table) throw new Error('Missing reviewed results columns');
    const rows: LeaderboardRow[] = [];
    for (const cells of table.slice(1)) {
      const [model, , ...years] = cells;
      if (years.length !== 8) throw new Error('Missing yearly cloze accuracy for ' + model);
      const scores = years.map(numberCell);
      rows.push({ model, setting: 'Helium 6B, cloze, 2018 to 2025', score: scores.reduce((a, b) => a + b, 0) / 8,
        metrics: Object.fromEntries(scores.map((value, i) => [String(2018 + i), value])) });
    }
    return checked(rows, 5);
  },
};
export default board;
