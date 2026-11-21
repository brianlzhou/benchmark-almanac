// SpireBench measures long-horizon play in Slay the Spire at Ascension 20.
// Table 1 reports mean acts cleared over ten runs for each LLM agent.
// The paper states that mean acts cleared is its primary metric.
import type { Leaderboard } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
const url = 'https://arxiv.org/html/2610.12596';
export default {
  benchmark: 'spirebench', static: 'paper', url, feed: url,
  terms: 'The authors publish Table 1 on arXiv. https://arxiv.org/abs/2610.12596',
  async fetch() {
    const table = paperTables(await paperHtml(url)).map(grid).find(t =>
      t[0]?.[0] === 'Model' && t[0]?.includes('Runs') && t[1]?.[0] === 'Agents');
    if (!table) throw new Error('Missing SpireBench results table');
    const rows = table.slice(2).filter(c => c[0] && /^\d+$/.test(c[1]) && !/^(All human|1000\+|After an earlier|BottledAI)/.test(c[0]));
    const found = rows.map(c => {
      const match = c[0].match(/^(.+?)\s+\(([^)]+)\)$/);
      if (!match) throw new Error('Missing model reasoning setting: ' + c[0]);
      return { model: match[1], setting: match[2], score: Number(c[6]), trials: Number(c[1]),
        metrics: { actWinRate: Number(c[5]), meanFloor: Number(c[7]), medianFloor: Number(c[8]) },
        cost: /^[-–]/.test(c[13]) ? undefined : Number(c[13]) };
    });
    return checked(found, 19);
  },
} satisfies Leaderboard;
