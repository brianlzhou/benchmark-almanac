// ROSTrans measures whether robot software still works after a migration from ROS 1 to ROS 2.
// Table I reports pass@1 across 108 tasks, its bootstrap interval, and pass rates by architectural level.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = "https://arxiv.org/html/2610.41168";
const header = ["Model", "pass@1 (%)", "pass@3", "pass@5", "by level (%)", "by level (%)", "by level (%)"];
const columns: Record<string, number> = {"interface": 4, "behavior": 5, "system": 6};
const board: Leaderboard = {
  benchmark: "rostrans", url: feed, feed, static: 'paper',
  terms: "The authors publish this table under the terms linked at https://arxiv.org/abs/2610.41168." ,
  parts: {"interface": "Interface", "behavior": "Behavior", "system": "System"},
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const table = tables.find(t => t[0]?.join('|') === header.join('|') && t[1]?.slice(-3).join('|') === 'Intf.|Behav.|Sys.');
    if (!table) throw new Error('The reviewed results table is missing');
    const rows: LeaderboardRow[] = [];
    for (const row of table.slice(2)) {
      const interval = row[1].match(/^([\d.]+) \[([\d.]+),\s*([\d.]+)\]$/);
      if (!interval) throw new Error('Missing pass@1 interval');
      const model = row[0];
      const metrics = Object.fromEntries(Object.entries(columns).map(([key, i]) => [key, numberCell(row[i])]));
      metrics.passAt3 = numberCell(row[2]);
      metrics.passAt5 = numberCell(row[3]);
      const score = numberCell(interval[1]);
      rows.push({ model, score, metrics, low: numberCell(interval[2]), high: numberCell(interval[3]), trials: 5 });
    }
    return checked(rows, 6);
  },
};
export default board;
