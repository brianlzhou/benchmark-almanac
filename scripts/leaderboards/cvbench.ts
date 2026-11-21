// CV-Bench tests 2D and 3D vision. The paper defines overall accuracy as the mean of the two percentages in its model comparison.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';

const FEED = 'https://arxiv.org/html/2406.16860';

const board: Leaderboard = {
  benchmark: 'cvbench', static: 'paper',
  url: 'https://arxiv.org/abs/2406.16860',
  feed: FEED,
  terms: PAPER_TERMS,
  async fetch() {
    const tables = inlinePaperTables(await paperHtml(FEED));
    const table = tables.find(t => t[1]?.[0] === 'Method' && t[1]?.[1] === '# Vis Tok.' && t[1].some(h => h.includes('CV-Bench')));
    if (!table) throw new Error('Missing CV-Bench model table');
    const cols = ['2D', '3D'].map(dim => table[1].findIndex(h => h.includes('CV-Bench') && h.includes(dim)));
    if (cols.includes(-1)) throw new Error('Missing CV-Bench accuracy column');
    board.parts = { twoD: 'CV-Bench 2D', threeD: 'CV-Bench 3D' };
    const rows: LeaderboardRow[] = [];
    for (const row of table.slice(2)) {
      if (row[0].startsWith('Base LLM:') || cols.every(i => row[i] === '-')) continue;
      if (cols.some(i => !/^\d+(?:\.\d+)?$/.test(row[i]))) throw new Error('Invalid CV-Bench accuracy');
      const [twoD, threeD] = cols.map(i => Number(row[i]));
      rows.push({ model: row[0], score: Math.round((twoD + threeD) * 50) / 100, metrics: { twoD, threeD } });
    }
    if (rows.length < 10) throw new Error('Incomplete CV-Bench comparison');
    return rows;
  },
};
export default board;
