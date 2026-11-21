// GR-1 Tabletop tests 24 simulated manipulation tasks. The GR00T N1 paper reports average task success at three demonstration counts.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';

const FEED = 'https://arxiv.org/html/2503.14734';

const board: Leaderboard = {
  benchmark: 'robocasa-gr1-tabletop', static: 'paper',
  url: 'https://arxiv.org/abs/2503.14734',
  feed: FEED,
  terms: PAPER_TERMS,
  async fetch() {
    const tables = inlinePaperTables(await paperHtml(FEED));
    const detail = tables.find(t => t[0]?.[0] === 'Task' && t.some(r => r[0] === 'GR-1 Average'));
    const main = tables.find(t => t[0]?.join('|') === '|RoboCasa|DexMG|GR-1|Average');
    if (!detail || !main || detail[0].length !== 7) throw new Error('Missing GR-1 comparison');
    const start = detail.findIndex(r => r[0] === 'GR-1 Tabletop (24 Tasks)');
    const end = detail.findIndex(r => r[0] === 'GR-1 Average');
    if (start < 0 || end - start !== 25) throw new Error('Incomplete GR-1 tasks');
    const number = (s: string) => {
      if (!/^\d+(?:\.\d+)?%?$/.test(s)) throw new Error('Invalid GR-1 success rate');
      return Number(s.replace('%', ''));
    };
    const tasks = detail.slice(start+1, end);
    board.parts = Object.fromEntries(tasks.map(r => [r[0], r[0]]));
    const rows: LeaderboardRow[] = detail[0].slice(1).map((model, i) => ({
      model, setting: detail[1][i+1], score: number(detail[end][i+1]),
      metrics: Object.fromEntries(tasks.map(r => [r[0], number(r[i+1])])),
    }));
    for (const r of main.slice(1)) {
      const row = rows.find(x => x.model === r[0] && x.setting === '100 demos');
      if (!row) rows.push({ model: r[0], setting: '100 demos', score: number(r[3]) });
      else if (row.score !== number(r[3])) throw new Error('Conflicting GR-1 averages');
    }
    if (rows.length < 7) throw new Error('Missing GR-1 baseline');
    return rows;
  },
};
export default board;
