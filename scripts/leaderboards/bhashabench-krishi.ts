// BhashaBench-Krishi tests agricultural knowledge in India. Table 1 reports
// zero-shot accuracy across both languages. Tables 12 and 13 break it down by difficulty and question type.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2510.25409';
const board: Leaderboard = {
  benchmark: 'bhashabench-krishi', static: 'paper', feed, url: feed,
  terms: 'The authors publish the tables under the terms linked at https://arxiv.org/abs/2510.25409.',
  aliases: { 'gemma-3-270m': 'gemma-3-270m-base', 'Qwen3-235B-A22B-Instruct-2507': 'qwen3-235b-a22b-instruct-jul-2025' },
  parts: {Eng: 'English', Hin: 'Hindi', Easy: 'Easy', Med: 'Medium', Hard: 'Hard',
    'A/R': 'Assertion/Reason', FIB: 'Fill in the Blanks', MCQ: 'Multiple Choice',
    MTC: 'Match the Column', RTS: 'Rearrange the Sequence'},
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const results = new Map<string, LeaderboardRow>();
    for (const columns of [['Eng', 'Hin', 'Avg'], ['Easy', 'Hard', 'Med'], ['A/R', 'FIB', 'MCQ', 'MTC', 'RTS']]) {
      const table = tables.find(t => t[0]?.[0] === 'Model' && t[0].includes('BBK') && t[1]?.includes(columns[0]));
      const start = table?.[0].indexOf('BBK') ?? -1;
      if (!table || columns.some((c, j) => table[0][start + j] !== 'BBK' || table[1][start + j] !== c)) {
        throw new Error('Missing BBK columns: ' + columns.join(', '));
      }
      for (const cells of table.slice(2)) {
        if (cells.every(cell => cell === cells[0])) continue;
        const model = cells[0].replace(/25076$/, '2507');
        const row = results.get(model) ?? { model, setting: 'Zero-shot', score: NaN, metrics: {} };
        for (const [j, key] of columns.entries()) {
          const value = numberCell(cells[start + j]);
          if (key === 'Avg') row.score = value;
          else row.metrics![key] = value;
        }
        results.set(model, row);
      }
    }
    return checked([...results.values()], 31);
  },
};
export default board;
