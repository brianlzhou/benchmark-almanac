// ReasonSeg tests whether models can find an object from an implicit instruction.
// Table 1 reports the preferred mean per-image IoU (gIoU) on the full test set.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = "https://arxiv.org/html/2308.00692";
const header = ["Method", "gIoU", "cIoU", "gIoU", "cIoU", "gIoU", "cIoU", "gIoU", "cIoU"];
const columns: Record<string, number> = {"valGIou": 1, "valCIou": 2, "shortGIou": 3, "shortCIou": 4, "longGIou": 5, "longCIou": 6, "cIoU": 8};
const board: Leaderboard = {
  benchmark: "reasonseg", url: feed, feed, static: 'paper',
  terms: "The authors publish this table under the terms linked at https://arxiv.org/abs/2308.00692." ,
  parts: {"valGIou": "Validation gIoU", "valCIou": "Validation cIoU", "shortGIou": "Short query gIoU", "shortCIou": "Short query cIoU", "longGIou": "Long query gIoU", "longCIou": "Long query cIoU", "cIoU": "Test cIoU"},
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const table = tables.find(t => t[2]?.join('|') === header.join('|') && t[1].slice(-2).every(v => v === 'overall') && t[0][7] === 'test');
    if (!table) throw new Error('The reviewed results table is missing');
    const rows: LeaderboardRow[] = [];
    for (const row of table.slice(3)) {
      const model = row[0].replace(' (ft)', '').split(' + ')[0];
      const metrics = Object.fromEntries(Object.entries(columns).map(([key, i]) => [key, numberCell(row[i])]));
      const score = numberCell(row[7]);
      rows.push({ model, score, metrics, ...(row[0].endsWith(' (ft)') ? { setting: 'Fine-tuned on 239 ReasonSeg examples' } : {}), ...(row[0].includes(' + ') ? { models: row[0].split(' + '), harness: 'OVSeg' } : {}) });
    }
    return checked(rows, 15);
  },
};
export default board;
