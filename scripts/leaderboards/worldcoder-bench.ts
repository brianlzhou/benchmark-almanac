// WorldCoder-Bench measures whether models can build executable 3D worlds from natural-language tasks.
// The headline is the paper's V-Cov percentage on the 205-task WorldCoder-Core evaluation.
// This importer reads Table 1 of the benchmark paper.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const URL = 'https://arxiv.org/html/2606.01869';
const board: Leaderboard = {
  benchmark: 'worldcoder-bench', static: 'paper', url: URL, feed: URL, terms: PAPER_TERMS,
  async fetch() {
    const table = paperTables(await paperHtml(URL)).map(grid).find(rows => rows[0]?.[0] === 'Model' && rows[0]?.[1]?.includes('V-Cov'));
    if (!table) throw new Error('WorldCoder Table 1 missing');
    const rows: LeaderboardRow[] = [];
    for (const row of table.slice(1)) {
      const model = row[0]?.replace(/\s*\[.*$/, '').trim();
      const score = Number(row[1]);
      if (!model || !Number.isFinite(score) || /^(Proprietary|Additional API)/.test(model)) continue;
      rows.push({ model, score, metrics: { simulation: Number(row[2]), rendering: Number(row[3]), app: Number(row[4]), aCov: Number(row[5]), sCov: Number(row[6]), tCov: Number(row[7]) } });
    }
    return checked(rows, 2);
  },
};
export default board;
