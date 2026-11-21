// NoisyBench tests robustness to distractors across eleven tasks.
// Table 1 reports a harmonic mean across all eleven scores for each distractor setting.
// The parenthesized percentage compares that mean with the same model’s clean result.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = "https://arxiv.org/html/2601.07226";
const header = ["Models", "Distractors", "SealQA", "MultihopRAG", "Musique", "BBEH-Mini", "AIME25", "GPQA", "SA", "SI", "BBQ", "TR", "TA", "Avg. (\\Delta)"];
const columns: Record<string, number> = {"SealQA": 2, "MultihopRAG": 3, "Musique": 4, "BBEH-Mini": 5, "AIME25": 6, "GPQA": 7, "SA": 8, "SI": 9, "BBQ": 10, "TR": 11, "TA": 12};
const board: Leaderboard = {
  benchmark: "noisybench", url: feed, feed, static: 'paper',
  terms: "The authors publish this table under the terms linked at https://arxiv.org/abs/2601.07226." ,
  stats: { relativeChange: { name: 'Relative change', unit: '%', note: 'Percentage change in the harmonic mean compared with the same model without distractors.' } },
  parts: {"SealQA": "SealQA", "MultihopRAG": "MultihopRAG", "Musique": "Musique", "BBEH-Mini": "BBEH-Mini", "AIME25": "AIME25", "GPQA": "GPQA", "SA": "SA", "SI": "SI", "BBQ": "BBQ", "TR": "TR", "TA": "TA"},
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const table = tables.find(t => t[1]?.join('|') === header.join('|'));
    if (!table) throw new Error('The reviewed results table is missing');
    const rows: LeaderboardRow[] = [];
    const settings: Record<string, string> = { ND: 'No distractor', RD: 'Random documents', RC: 'Random chat', HN: 'Hard negatives' };
    for (const row of table.slice(2)) {
      const setting = settings[row[1]];
      const avg = row[13].match(/^(\d+(?:\.\d+)?)(?:\s*\(\s*([+-]?\d+(?:\.\d+)?)%\s*\))?$/);
      if (!setting || !avg || (row[1] !== 'ND' && !avg[2])) throw new Error('Invalid distractor setting or average');
      const model = row[0];
      const metrics = Object.fromEntries(Object.entries(columns).map(([key, i]) => [key, numberCell(row[i])]));
      const score = Number(avg[1]);
      if (avg[2]) metrics.relativeChange = Number(avg[2]);
      rows.push({ model, score, metrics, setting });
    }
    return checked(rows, 28);
  },
};
export default board;
