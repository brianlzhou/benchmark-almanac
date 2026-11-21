// Poker Arena tests strategic play in no-limit Texas Hold’em.
// Table 2 reports cumulative chip profit across 50 sessions. The standard deviation is for per-session chip changes.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = "https://arxiv.org/html/2606.13815";
const header = ["Model", "Hands", "Win %", "1st", "Chip \\Delta", "\\sigma_{\\Delta}", "Avg. pos."];
const board: Leaderboard = {
  benchmark: "poker-arena", url: feed, feed, static: 'paper',
  terms: "The authors publish this table under the terms linked at https://arxiv.org/abs/2606.13815." ,
  aliases: {"Kimi K2 (thinking)": "kimi-k2-thinking"},
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const table = tables.find(t => t[0]?.join('|') === header.join('|'));
    if (!table) throw new Error('The reviewed results table is missing');
    const rows: LeaderboardRow[] = [];
    for (const row of table.slice(1)) {
      const model = row[0];
      const score = numberCell(row[4].replaceAll('{,}', '').replace(/^\+/, ''));
      rows.push({ model, score, trials: 50, metrics: { handsWon: numberCell(row[1]), winPercent: numberCell(row[2]), firstPlaceFinishes: numberCell(row[3]), sessionChipStd: numberCell(row[5]), averagePosition: numberCell(row[6]) } });
    }
    return checked(rows, 7);
  },
};
export default board;
