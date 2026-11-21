// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// Table 2 evaluates session storage decisions using F1 on the static and dynamic splits.
// The paper separately plots downstream memory retention in Figure 5.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = "https://arxiv.org/html/2605.25535";
const header = ["Model", "Method", "F1 (\\uparrow)", "FNR (\\downarrow)", "FPR (\\downarrow)", "F1 (\\uparrow)", "FNR (\\downarrow)", "FPR (\\downarrow)"];
const columns: Record<string, number> = {"staticF1": 2, "dynamicF1": 5};
const board: Leaderboard = {
  benchmark: "permembench", url: feed, feed, static: 'paper',
  terms: "The authors publish this table under the terms linked at https://arxiv.org/abs/2605.25535." ,
  parts: {"staticF1": "PerMem-Bench static", "dynamicF1": "PerMem-Bench dynamic"},
  stats: { staticFNR: { name: 'Static false negative rate', unit: 'score', better: 'lower', note: 'False negative rate from 0 to 1 on the static split.' }, staticFPR: { name: 'Static false positive rate', unit: 'score', better: 'lower', note: 'False positive rate from 0 to 1 on the static split.' }, dynamicFNR: { name: 'Dynamic false negative rate', unit: 'score', better: 'lower', note: 'False negative rate from 0 to 1 on the dynamic split.' }, dynamicFPR: { name: 'Dynamic false positive rate', unit: 'score', better: 'lower', note: 'False positive rate from 0 to 1 on the dynamic split.' } },
  headline: "The headline is the plain mean of session-gating F1 on the static and dynamic splits.",
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const table = tables.find(t => t[1]?.join('|') === header.join('|') && t[0][2] === 'PerMem-Bench s' && t[0][5] === 'PerMem-Bench d');
    if (!table) throw new Error('The reviewed results table is missing');
    const rows: LeaderboardRow[] = [];
    for (const row of table.slice(2)) {
      const model = row[0];
      const metrics = Object.fromEntries(Object.entries(columns).map(([key, i]) => [key, numberCell(row[i])]));
      metrics.staticFNR = numberCell(row[3]);
      metrics.staticFPR = numberCell(row[4]);
      metrics.dynamicFNR = numberCell(row[6]);
      metrics.dynamicFPR = numberCell(row[7]);
      const score = (metrics.staticF1 + metrics.dynamicF1) / 2;
      rows.push({ model, score, metrics, harness: row[1] + ' session gating' });
    }
    return checked(rows, 6);
  },
};
export default board;
