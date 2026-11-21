// LIMIT tests retrieval of two relevant documents from a corpus of 50,000.
// Table 5 reports recall at ranks 2, 10 and 100 for each model and embedding dimension.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = "https://arxiv.org/html/2508.21038";
const header = ["Model", "Dim", "Recall@2", "Recall@10", "Recall@100"];
const board: Leaderboard = {
  benchmark: "limit", url: feed, feed, static: 'paper',
  terms: "The authors publish this table under the terms linked at https://arxiv.org/abs/2508.21038." ,
  stats:{recallAt10:{name:'Recall@10',unit:'%',better:'higher'},recallAt100:{name:'Recall@100',unit:'%',better:'higher'}},
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const table = tables.find(t => t[0]?.join('|') === header.join('|'));
    if (!table) throw new Error('The reviewed results table is missing');
    const rows: LeaderboardRow[] = [];
    for (const row of table.slice(1)) {
      const model = row[0];
      const score = numberCell(row[2]);
      rows.push({ model, score, setting: row[1] === 'default' ? 'Default' : row[1] + ' dimensions', metrics: { recallAt10: numberCell(row[3]), recallAt100: numberCell(row[4]) } });
    }
    return checked(rows, 65);
  },
};
export default board;
