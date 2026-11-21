// Formal Conjectures tests automated theorem-proving systems on frozen Lean problem sets.
// The score is the percentage of FC100SolvedSet1 statements with a proof accepted by Lean.
// This importer reads Table 2 of the benchmark paper, which reports three named systems.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const URL = 'https://arxiv.org/html/2605.13171v1';

const board: Leaderboard = {
  benchmark: 'formal-conjectures',
  static: 'paper',
  url: URL,
  feed: URL,
  terms: PAPER_TERMS,
  parts: { FC100SolvedSet1: { name: 'FC100SolvedSet1', group: 'Frozen subset', unit: '%' } },
  async fetch() {
    const tables = paperTables(await paperHtml(URL)).map(grid);
    const table = tables.find((rows) => JSON.stringify(rows[0]) === '["Method","Proved (%)"]');
    if (!table) throw new Error('Formal Conjectures Table 2 missing');
    const rows: LeaderboardRow[] = table.slice(1).map((cells) => {
      const method = cells[0];
      const score = Number.parseFloat(cells[1]?.replace('%', ''));
      if (!method || !Number.isFinite(score)) throw new Error('Formal Conjectures Table 2 has an invalid row');
      const match = method.match(/^(.*) \((.*)\)$/);
      return { model: match ? match[1] : method, setting: match?.[2], score, metrics: { FC100SolvedSet1: score } };
    });
    return checked(rows, 3);
  },
};

export default board;
