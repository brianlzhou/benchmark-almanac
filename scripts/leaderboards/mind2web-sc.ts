// Mind2Web-SC tests whether a guard detects web actions that violate user restrictions.
// Table 1 reports label prediction accuracy and four additional measures on the SeeAct examples.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2406.09187';
const board: Leaderboard = {
  benchmark: 'mind2web-sc', static: 'paper', url: feed, feed,
  terms: 'The authors publish this table under the terms listed at https://arxiv.org/abs/2406.09187.',
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const table = tables.find(t => t[0]?.[7] === 'SeeAct on Mind2Web-SC' && t[1]?.slice(7).join('|') === 'LPA|LPP|LPR|EA|FRA');
    if (!table) throw new Error('Missing Mind2Web-SC columns');
    let model = '';
    const rows: LeaderboardRow[] = table.slice(2).map(r => {
      model = r[0] || model;
      const [lpa, lpp, lpr, ea, fra] = r.slice(7);
      const metrics: Record<string, number> = {lpp: numberCell(lpp), lpr: numberCell(lpr), fra: numberCell(fra)};
      if (ea !== 'n.a.') metrics.ea = numberCell(ea);
      return {model, harness: r[1], score: numberCell(lpa), metrics};
    });
    return checked(rows, 13);
  },
};
export default board;
