// Matter-of-Fact tests the feasibility of scientific claims. Table 2 gives overall classification accuracy.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2506.04410';
const parts = { true: 'True', false: 'False', qualitative: 'Qualitative', quantitative: 'Quantitative',
  experimental: 'Experimental', code: 'Code or simulation', theoretical: 'Theoretical', integrative: 'Integrative' };

const board: Leaderboard = {
  benchmark: 'matter-of-fact', static: 'paper', url: feed, feed, terms: PAPER_TERMS, parts,
  aliases: { 'claude-sonnet 3.7': 'claude-3-7-sonnet' },
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t => t[0]?.includes('Accuracy by Category'));
    if (table?.[1]?.join('|') !== 'Model|Accuracy|True|False|Qual.|Qnt.|Exp.|Code|Ther.|Int.|(per 1k)') {
      throw new Error('Missing Table 2 accuracy or cost columns');
    }
    const rows: LeaderboardRow[] = [];
    let model = '';
    for (const cells of table.slice(2)) {
      const [setting, overall, ...other] = cells;
      if (setting === 'Random Baseline') continue;
      if (cells.every(c => c === setting)) { model = setting; continue; }
      const values = [overall, ...other.slice(0, 8)].map(Number);
      const cost = Number(other[8]?.replace(/^\$/, '')) / 1000;
      if (!model || cells.length !== 11 || !values.every(v => Number.isFinite(v) && v >= 0 && v <= 1) || !Number.isFinite(cost)) throw new Error('Invalid feasibility row');
      const metrics = Object.fromEntries(Object.keys(parts).map((k, i) => [k, Math.round(values[i+1]*100)]));
      rows.push({ model, setting, score: Math.round(values[0]*100), cost, metrics });
    }
    return checked(rows, 15);
  },
};
export default board;
