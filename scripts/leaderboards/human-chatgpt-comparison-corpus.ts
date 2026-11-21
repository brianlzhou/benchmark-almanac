// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// HC3 tests whether text detectors distinguish ChatGPT answers from human answers.
// Table 4 gives each detector's average F1 in English and Chinese under six training settings.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2301.07597';
const board: Leaderboard = {
  benchmark: 'human-chatgpt-comparison-corpus', url: feed, feed, static: 'paper',
  terms: 'The authors publish Table 4 at https://arxiv.org/abs/2301.07597.',
  headline: 'The paper gives no bilingual F1, so this is the plain mean of the English and Chinese average F1 scores.',
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t => t[0]?.length === 16 && t[0][2] === 'English' && t[0][9] === 'Chinese');
    if (!table || table[2].slice(2).join('|') !== Array(2).fill('full|sent|mix|full|sent|mix|Avg.').join('|')) throw new Error('Missing HC3 results table');
    const rows: LeaderboardRow[] = [];
    const parts: NonNullable<Leaderboard['parts']> = {};
    let model = '';
    for (const row of table.slice(3)) {
      if (row[0].startsWith('Train')) { model = row[2]; continue; }
      if (!model || row.length !== 16 || !['raw', 'filtered'].includes(row[0])) throw new Error('HC3 training row changed');
      const metrics: Record<string, number> = {};
      for (let col = 2; col < 16; col++) {
        const language = table[0][col];
        const split = table[1][col];
        const key = split === 'Avg.' ? language : [language, split, table[2][col]].join('_');
        parts[key] = split === 'Avg.' ? { name: language, group: 'Language' } : { name: split + ' ' + table[2][col], group: language };
        metrics[key] = numberCell(row[col]);
      }
      rows.push({ model, setting: 'Train: ' + row.slice(0, 2).join('-'), metrics, score: (metrics.English + metrics.Chinese) / 2 });
    }
    board.parts = parts;
    return checked(rows, 12);
  },
};
export default board;
