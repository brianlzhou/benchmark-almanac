// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// Table 5 evaluates whether reward models judge a mobile GUI agent's steps and final outcomes correctly. Both tracks use F1 in percent.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = "https://arxiv.org/html/2505.21496";
const header = ["Model", "Overall", "Easy", "Medium", "Hard", "Overall", "Easy", "Medium", "Hard"];
const columns: Record<string, number> = {"step": 1, "stepEasy": 2, "stepMedium": 3, "stepHard": 4, "outcome": 5, "outcomeEasy": 6, "outcomeMedium": 7, "outcomeHard": 8};
const board: Leaderboard = {
  benchmark: "ui-genie-rm-evaluation", url: feed, feed, static: 'paper',
  terms: "The authors publish this table under the terms linked at https://arxiv.org/abs/2505.21496." ,
  parts: {"step": "Step Reward", "stepEasy": "Step Reward: Easy", "stepMedium": "Step Reward: Medium", "stepHard": "Step Reward: Hard", "outcome": "Outcome Reward", "outcomeEasy": "Outcome Reward: Easy", "outcomeMedium": "Outcome Reward: Medium", "outcomeHard": "Outcome Reward: Hard"},
  headline: "The paper reports no combined F1 score, so this is the plain mean of step reward and outcome reward F1.",
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const table = tables.find(t => t[1]?.join('|') === header.join('|') && t[0][1] === 'Step Reward' && t[0][5] === 'Outcome Reward');
    if (!table) throw new Error('The reviewed results table is missing');
    const rows: LeaderboardRow[] = [];
    for (const row of table.slice(2)) {
      const model = row[0].replace(' (Ours)', '');
      const metrics = Object.fromEntries(Object.entries(columns).map(([key, i]) => [key, numberCell(row[i])]));
      const score = (metrics.step + metrics.outcome) / 2;
      rows.push({ model, score, metrics });
    }
    return checked(rows, 6);
  },
};
export default board;
