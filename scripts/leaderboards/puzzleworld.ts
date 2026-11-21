// PuzzleWorld tests whether models solve multimodal puzzle-hunt problems.
// Table 2 reports overall final answer and stepwise accuracy, plus both measurements by modality.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = "https://arxiv.org/html/2506.06211";
const header = ["", "Model", "Acc", "Step", "Acc", "Step", "Acc", "Step", "Acc", "Step"];
const columns: Record<string, number> = {"textAcc": 4, "textStep": 5, "visualAcc": 6, "visualStep": 7, "structuredAcc": 8, "structuredStep": 9};
const board: Leaderboard = {
  benchmark: "puzzleworld", url: feed, feed, static: 'paper',
  terms: "The authors publish this table under the terms linked at https://arxiv.org/abs/2506.06211." ,
  parts: {"textAcc": "Text answer accuracy", "textStep": "Text stepwise accuracy", "visualAcc": "Visual answer accuracy", "visualStep": "Visual stepwise accuracy", "structuredAcc": "Structured answer accuracy", "structuredStep": "Structured stepwise accuracy"},
  stats: { stepwiseAccuracy: { name: 'Overall stepwise accuracy', unit: '%', better: 'higher' } },
  aliases: {"GPT-o3": "o3"},
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const table = tables.find(t => t[1]?.join('|') === header.join('|') && t[0]?.join('|') === '||Overall|Overall|Text|Text|Visual|Visual|Structured|Structured');
    if (!table) throw new Error('The reviewed results table is missing');
    const rows: LeaderboardRow[] = [];
    for (const row of table.slice(2)) {
      if (row[0] === 'Human') continue;
      const model = row[1];
      const metrics = Object.fromEntries(Object.entries(columns).map(([key, i]) => [key, numberCell(row[i])]));
      const score = numberCell(row[2]);
      metrics.stepwiseAccuracy = numberCell(row[3]);
      rows.push({ model, score, metrics, open: row[0] === 'Open' });
    }
    return checked(rows, 9);
  },
};
export default board;
