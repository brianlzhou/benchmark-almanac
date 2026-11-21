// TraceSpatial-Bench tests whether a predicted path starts at the requested object and reaches its destination without a collision. Table 5 reports overall success on the original 100 items.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = "https://arxiv.org/html/2512.13660";
const header = ["Model", "Input", "Process", "2D Start", "2D End", "3D Start", "3D End", "Overall"];
const columns: Record<string, number> = {"start2D": 3, "end2D": 4, "start3D": 5, "end3D": 6};
const board: Leaderboard = {
  benchmark: "tracespatial-bench", url: feed, feed, static: 'paper',
  terms: "The authors publish this table under the terms linked at https://arxiv.org/abs/2512.13660." ,
  parts: {"start2D": "2D Start", "end2D": "2D End", "start3D": "3D Start", "end3D": "3D End"},
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const table = tables.find(t => t[0]?.join('|') === header.join('|'));
    if (!table) throw new Error('The reviewed results table is missing');
    const rows: LeaderboardRow[] = [];
    for (const row of table.slice(2)) {
      if (row[7] === '-') continue;
      const model = row[0].replace(/RoboTracer -/, 'RoboTracer-');
      const metrics = Object.fromEntries(Object.entries(columns).map(([key, i]) => [key, numberCell(row[i])]));
      const score = numberCell(row[7]);
      rows.push({ model, score, metrics, setting: row[1] + (row[2] === '✓' ? ', process reward' : row[2] === '✗' ? ', no process reward' : '') });
    }
    return checked(rows, 13);
  },
};
export default board;
