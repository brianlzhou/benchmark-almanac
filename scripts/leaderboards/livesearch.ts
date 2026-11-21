// LiveSearch tests agents on current financial figures. Table 1 ranks six models by answer accuracy using search without professional financial tools.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = "https://arxiv.org/html/2610.37166";
const header = ["Model", "Accuracy (%)"];
const board: Leaderboard = {
  benchmark: "livesearch", url: feed, feed, static: 'paper',
  terms: "The authors publish this table under the terms linked at https://arxiv.org/abs/2610.37166." ,
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const table = tables.find(t => t[0]?.join('|') === header.join('|'));
    if (!table) throw new Error('The reviewed results table is missing');
    const rows: LeaderboardRow[] = [];
    for (const row of table.slice(1)) {
      const identity = row[0].match(/^(.+?)(?: \((Max|High)\))?$/);
      if (!identity) throw new Error('Invalid LiveSearch model label');
      const model = identity[1];
      const score = numberCell(row[1]);
      rows.push({ model, score, setting: identity[2] ? 'Search only, ' + identity[2] : 'Search only' });
    }
    return checked(rows, 6);
  },
};
export default board;
