// CTI-to-MITRE classifies threat reports by ATT&CK technique. Table III gives F-measure on the authors' dataset.
import type { Leaderboard } from './types.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
const url = "https://arxiv.org/html/2208.12144";
const columns = ["fMeasure","precision","recall","ac3"];
const header = ["","F-Measure","Precision","Recall","AC@3"];
const board: Leaderboard = {
  benchmark: "cti-to-mitre", static: 'paper', url, feed: url, terms: PAPER_TERMS,
  parts: {"fMeasure":{"name":"F-Measure"},"precision":{"name":"Precision"},"recall":{"name":"Recall"},"ac3":{"name":"AC@3"}},
  async fetch() {
    const table = paperTables((await paperHtml(url)).split('<figure id="S4.T3"')[1]?.split("</figure>")[0] ?? "").map(grid).find(t => t[1]?.join("|") === header.join("|"));
    if (!table) throw new Error('Missing reviewed result columns');
    const rows = table.slice(2).map(c => {
      const cells = c.slice(1);
      if (cells.length !== columns.length || cells.some(v => !/^-?\d+(?:\.\d+)?\s*%?$/.test(v.trim()))) throw new Error("Invalid result for " + c[0]);
      const metrics = Object.fromEntries(columns.map((k,i) => [k,parseFloat(cells[i]) * 1]));
      return { model:c[0], score:metrics["fMeasure"], metrics };
    });
    return checked(rows,11);
  },
};
export default board;

