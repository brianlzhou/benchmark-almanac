import type { Leaderboard } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';
const URL = 'https://arxiv.org/html/1704.04683';
const board: Leaderboard = {
  benchmark: 'race', static: 'paper', parts: {
  middleSchool: { name: 'Middle school', group: 'Difficulty' },
  highSchool: { name: 'High school', group: 'Difficulty' },
}, url: URL, feed: URL + ' (combined RACE accuracy)', terms: PAPER_TERMS,
  async fetch() {
    const t = inlinePaperTables(await paperHtml(URL)).find(t => t[0]?.[1] === 'RACE-M' && t[0]?.[3] === 'RACE' && t.some(r => r[0] === 'Sliding Window'));
    if (!t) throw new Error('RACE results missing');
    const rows = t.slice(1).filter(r => ['Sliding Window','Stanford AR','GA'].includes(r[0])).map(r => ({model: r[0], score: Number(r[3]),
      setting: r[0] === 'Sliding Window' ? 'lexical baseline' : 'supervised', metrics: {middleSchool: Number(r[1]), highSchool: Number(r[2])}}));
    if (rows.length !== 3) throw new Error('RACE baseline model rows changed');
    return rows;
  },
};
export default board;
