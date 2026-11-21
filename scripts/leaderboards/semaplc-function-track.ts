// SemaPLC evaluates Structured Text generated for 117 control tasks. Table I reports the strict verified-pass rate for each model and harness.
import type { Leaderboard } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { grid, paperTables, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2608.18565';
const board: Leaderboard = {
  benchmark: 'semaplc-function-track', url: feed, feed, static: 'paper',
  terms: 'The authors publish Table I under the paper terms linked at https://arxiv.org/abs/2608.18565.',
  aliases: { 'DS-V4-Flash': 'deepseek-v4-flash', 'DS-V4-Pro': 'deepseek-v4-pro' },
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t =>
      t[1]?.join('|') === 'Model|LLM4PLC|AutoPLC|Agents4PLC|bare|full' && t[0][4] === 'SemaPLC');
    if (!table) throw new Error('SemaPLC function-track Table I is missing');
    const rows = table.slice(2).filter(r => !['Mean', 'Worst'].includes(r[0])).flatMap(([model, ...scores]) =>
      table[1].slice(1).map((name, index) => ({
        model, harness: index < 3 ? name : 'SemaPLC', setting: index < 3 ? undefined : name,
        score: numberCell(scores[index]),
      })));
    return checked(rows, 35);
  },
};
export default board;
