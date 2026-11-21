// AndroidControl measures next-action accuracy. Table 12 compares two agents on the full test split with high-level and low-level instructions.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';

const FEED = 'https://arxiv.org/html/2406.03679';

const board: Leaderboard = {
  benchmark: 'androidcontrol', static: 'paper',
  url: 'https://arxiv.org/abs/2406.03679',
  feed: FEED,
  terms: PAPER_TERMS,
  async fetch() {
    const tables = inlinePaperTables(await paperHtml(FEED));
    const t = tables.find(t => t[0]?.join('|') === '|Model|Test split|Step accuracy|Step accuracy');
    if (!t || t[1]?.slice(3).join('|') !== 'high-level|low-level') throw new Error('Missing AndroidControl full-test comparison');
    const rows: LeaderboardRow[] = [];
    for (const c of t.slice(2).filter(c => c[2] === 'Full')) {
      const subset = t.find(r => r[1] === c[1] && r[2] === 'Random-500' && r[0] === c[0]);
      if (!subset) throw new Error('Missing Random-500 comparison');
      for (const i of [3, 4]) {
        if (![c[i], subset[i]].every(s => /^\d+(?:\.\d+)?$/.test(s))) throw new Error('Invalid AndroidControl accuracy');
        rows.push({ model: c[1], setting: c[0] + ', ' + t[1][i], score: Number(c[i]), metrics: { random500: Number(subset[i]) } });
      }
    }
    board.parts = { random500: 'Random-500' };
    if (rows.length < 4) throw new Error('Incomplete full-test comparison');
    return rows;
  },
};
export default board;
