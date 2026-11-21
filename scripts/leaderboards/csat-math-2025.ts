// CSAT Math 2025 measures pass@1 across the three Korean mathematics electives. The EXAONE Deep paper gives the combined score and a separate table for each elective.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://arxiv.org/html/2503.12524';

const board: Leaderboard = {
  benchmark: 'csat-math-2025', static: 'paper',
  url: 'https://arxiv.org/abs/2503.12524',
  feed: FEED,
  terms: PAPER_TERMS,
  aliases: {"DeepSeek-R1 (671B)": "deepseek-r1"},
  async fetch() {
    const tables = flatPaperTables(await paperHtml(FEED)).map(grid);
    const main = tables.find(t => t[0]?.includes('CSAT 2025 (pass@1)'));
    const parts = tables.find(t => t[0]?.[1] === 'CSAT 2025 Calculus (pass@1)');
    if (!main || !parts || main.length < 12 || parts[0].slice(2).join('|') !== 'CSAT 2025 Statistics (pass@1)|CSAT 2025 Geometry (pass@1)') throw new Error('Missing CSAT 2025 comparison');
    board.parts = { calculus: 'Calculus', statistics: 'Statistics', geometry: 'Geometry' };
    const column = main[0].indexOf('CSAT 2025 (pass@1)');
    return main.slice(1).map(c => {
      const part = parts.find(r => r[0] === c[0]);
      if (!part || ![c[column], ...part.slice(1)].every(v => /^\d+(?:\.\d+)?$/.test(v))) throw new Error('Missing CSAT score');
      const [calculus, statistics, geometry] = part.slice(1).map(Number);
      return { model: c[0], score: Number(c[column]), metrics: { calculus, statistics, geometry } };
    });
  },
};
export default board;
