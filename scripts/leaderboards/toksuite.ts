// TokSuite measures relative accuracy loss after text perturbations. Tables 1 and 28 report the multilingual average drop for controlled and external models.
// The controlled models share one architecture. Their tokenizer names identify TokSuite checkpoints, not the original models.
import type { Leaderboard, LeaderboardRow, BoardPart } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { grid, paperTables, checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2512.20757';
const board: Leaderboard = {
  benchmark: 'toksuite', static: 'paper', url: feed, feed,
  terms: 'The authors publish the tables under the terms linked at https://arxiv.org/abs/2512.20757.',
  headline: 'The paper reports the average relative drop in accuracy across perturbations. Smaller percentages indicate greater robustness.',
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const rows: LeaderboardRow[] = [];
    const parts: Record<string, BoardPart> = {};
    for (const [marker, prefix] of [['TokenMonster', 'TokSuite-'], ['xglm-564M','']]) {
      const t = tables.find(t => t[0]?.[1] === 'Input' && t[0]?.at(-1) === 'Avg' && t[2]?.[0] === marker);
      if (!t || t[0].length !== 13 || t[1][1] !== 'NEN') throw new Error('TokSuite robustness table missing');
      for (const cells of t.slice(2)) {
        if (cells[0] === 'Avg') continue;
        const metrics: Record<string, number> = {};
        for (let i=1; i<12; i++) {
          const key = 'perturbation'+i;
          parts[key] = { name: t[0][i] + ' (' + t[1][i] + ')', unit: '%', better: 'lower' };
          metrics[key] = Math.round(numberCell(cells[i])*100);
        }
        rows.push({ model: prefix + cells[0], score: Math.round(numberCell(cells[12])*100), metrics });
      }
    }
    board.parts = parts;
    return checked(rows,34);
  },
};
export default board;
