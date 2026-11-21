// Swivuriso tests multilingual speech recognition in seven South African languages.
// Table 9 gives held-out word error rates at two training checkpoints, converted here to percent.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2512.02201';
const board: Leaderboard = {
  benchmark: 'swivuriso', static: 'paper', url: feed + '#S5', feed,
  terms: 'The authors publish Table 9 on arXiv. https://arxiv.org/abs/2512.02201',
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t => t[0]?.[0] === 'Model' && t[0][1] === '1K Steps' && t[0][2]?.startsWith('10K Steps'));
    if (!table) throw new Error('Missing multilingual WER table');
    const rows: LeaderboardRow[] = [];
    for (const [model, early, late] of table.slice(1)) {
      rows.push({model, setting: '1,000 training steps', score: numberCell(early) * 100});
      rows.push({model, setting: '10,000 training steps', score: numberCell(late) * 100});
    }
    return checked(rows, 6);
  },
};
export default board;
