// MemTrapBench tests whether earlier conversations distort answers to new questions. Table 1 gives the average performance across four scenarios.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = "https://arxiv.org/html/2608.20202";
const header = ["Model", "Memory Strategy", "Task Boundary", "Cognitive Bias", "Trauma", "Safety", "Avg."];
const columns: Record<string, number> = {"Task Boundary": 2, "Cognitive Bias": 3, "Trauma": 4, "Safety": 5};
const board: Leaderboard = {
  benchmark: "memtrapbench", url: feed, feed, static: 'paper',
  terms: "The authors publish this table under the terms linked at https://arxiv.org/abs/2608.20202." ,
  parts: {"Task Boundary": "Task Boundary", "Cognitive Bias": "Cognitive Bias", "Trauma": "Trauma", "Safety": "Safety"},
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const table = tables.find(t => t[1]?.join('|') === header.join('|'));
    if (!table) throw new Error('The reviewed results table is missing');
    const rows: LeaderboardRow[] = [];
    for (const row of table.slice(2)) {
      const model = row[0].replace(/ -/g, '-');
      const metrics = Object.fromEntries(Object.entries(columns).map(([key, i]) => [key, numberCell(row[i])]));
      const score = numberCell(row[6]);
      rows.push({ model, score, metrics, ...(['wo/Mem', 'FullText'].includes(row[1]) ? { setting: row[1] } : { harness: row[1] }) });
    }
    return checked(rows, 12);
  },
};
export default board;
