// SWE-Lancer Diamond managers choose proposals for freelance tasks. Tables 1 and 11 report
// pass@1 on 265 manager tasks, earnings and earn rate. Tables 2 and 3 break down the baseline results.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2502.12115';
const pct = (s: string) => numberCell(s.replace(/%$/, ''));
const board: Leaderboard = {
  benchmark: 'swe-lancer-manager', static: 'paper', url: 'https://arxiv.org/abs/2502.12115', feed,
  terms: 'arXiv robots.txt permits the HTML paper. The results are credited to OpenAI.',
  stats: { dollarsEarned: { name: 'Dollars earned', unit: 'usd', better: 'higher' }, totalPayout: { name: 'Total payout', unit: 'usd' }, earnRate: { name: 'Earn rate', unit: '%', better: 'higher' } },
  aliases: { 'GPT-4o': 'gpt-4o-aug-2024', '3.5 Sonnet': 'claude-3-5-sonnet', 'Deepseek-R1': 'deepseek-r1' },
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const results: LeaderboardRow[] = [];
    const headers = ['Model', 'User Tool', 'Dataset', 'pass@1', 'Dollars Earned / Total', 'Earn Rate'];
    for (const withEffort of [true, false]) {
      const expected = [...headers];
      if (withEffort) expected.splice(3, 0, 'Reasoning Effort');
      const table = tables.find(t => t[0]?.join('|') === expected.join('|'));
      if (!table) throw new Error('Missing SWE-Lancer result table');
      for (const cells of table.filter(r => r[2] === 'SWE Manager (Diamond)')) {
        const [score, earnings, rate] = cells.slice(withEffort ? 4 : 3);
        const money = earnings.match(/^\$(\d+)k \/ \$(\d+)k$/);
        if (!money) throw new Error('Unexpected SWE-Lancer payout');
        results.push({ model: cells[0], score: pct(score), setting: withEffort && cells[3] !== 'N/A' ? cells[3] : undefined,
          metrics: { dollarsEarned: Number(money[1]) * 1000, totalPayout: Number(money[2]) * 1000, earnRate: pct(rate) } });
      }
    }
    const breakdowns = tables.filter(t => t[0]?.[5] === 'SWE Manager' && t[1]?.[0] === 'Task Type');
    if (results.length < 5 || breakdowns.length !== 2) throw new Error('Incomplete SWE-Lancer manager results');
    board.parts = {};
    for (const table of breakdowns) {
      for (const [label, ...values] of table.slice(2)) {
        for (const row of results) {
          const name = row.model === '3.5 Sonnet' ? 'Sonnet 3.5' : row.model;
          const i = table[1].slice(5, 8).indexOf(name);
          if (i !== -1 && values[4 + i]?.endsWith('%')) {
            board.parts[label] = label;
            row.metrics![label] = pct(values[4 + i]);
          }
        }
      }
    }
    return results;
  },
};
export default board;
