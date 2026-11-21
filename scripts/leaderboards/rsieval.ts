// RSIEval tests aerial image understanding through captions and visual questions.
// Table I reports accuracy on all 936 visual questions and Table II reports quantity relative error.
// Caption graders assign letter grades, so those results do not share the accuracy scale.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = "https://arxiv.org/html/2307.15266";
const header = ["Method", "Presence", "Quantity", "Color", "Absolute pos.", "Relative pos.", "Area comp.", "Road dir.", "Image", "Scene", "Reasoning", "Avg accuracy"];
const columns: Record<string, number> = {"presence": 1, "quantity": 2, "color": 3, "absolutePosition": 4, "relativePosition": 5, "areaComparison": 6, "roadDirection": 7, "image": 8, "scene": 9, "reasoning": 10};
const board: Leaderboard = {
  benchmark: "rsieval", url: feed, feed, static: 'paper',
  terms: "The authors publish this table under the terms linked at https://arxiv.org/abs/2307.15266." ,
  parts: {"presence": "Presence", "quantity": "Quantity", "color": "Color", "absolutePosition": "Absolute position", "relativePosition": "Relative position", "areaComparison": "Area comparison", "roadDirection": "Road direction", "image": "Image", "scene": "Scene", "reasoning": "Reasoning"},
  headline: "The headline is accuracy across all 936 visual questions. The authors grade captions separately.",
  stats: { quantityRelativeError: { name: 'Quantity relative error', unit: '%', better: 'lower' } },
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const table = tables.find(t => t[0]?.join('|') === header.join('|'));
    if (!table) throw new Error('The reviewed results table is missing');
    const rows: LeaderboardRow[] = [];
    const error = tables.find(t => t[1]?.[0] === 'Quantity Relative Error');
    if (!error) throw new Error('Missing quantity relative error');
    for (const row of table.slice(1)) {
      const model = row[0].replace(' (ours)', '');
      const metrics = Object.fromEntries(Object.entries(columns).map(([key, i]) => [key, numberCell(row[i])]));
      metrics.quantityRelativeError = numberCell(error[1][error[0].indexOf(row[0])]);
      const score = numberCell(row[11]);
      rows.push({ model, score, metrics });
    }
    return checked(rows, 4);
  },
};
export default board;
