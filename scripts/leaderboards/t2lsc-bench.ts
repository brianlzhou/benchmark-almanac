// T2LSC-Bench evaluates localized text rendering in generated images. Table II lists target-anchor accuracy first and reports subject preservation and semantic leakage separately.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = "https://arxiv.org/html/2609.02255";
const header = ["Model", "N", "TAA", "SSP", "Al.", "Cf.", "Al.", "Cf.", "pp"];
const columns: Record<string, number> = {"ssp": 3, "alignedSlr": 4, "conflictSlr": 5, "alignedCslr": 6, "conflictCslr": 7, "deltaSlr": 8};
const board: Leaderboard = {
  benchmark: "t2lsc-bench", url: feed, feed, static: 'paper',
  terms: "The authors publish this table under the terms linked at https://arxiv.org/abs/2609.02255." ,
  parts: {"ssp": "Subject preservation", "alignedSlr": {"name": "Aligned SLR", "better": "lower"}, "conflictSlr": {"name": "Conflicting SLR", "better": "lower"}, "alignedCslr": {"name": "Aligned conditional SLR", "better": "lower"}, "conflictCslr": {"name": "Conflicting conditional SLR", "better": "lower"}, "deltaSlr": {"name": "SLR difference", "better": "lower", "note": "Percentage-point difference between conflicting and aligned conditions."}},
  aliases: {"GPT-1.5": "gpt-image-1-5", "Gemini 3.1": "gemini-3-1-flash-image", "Gemini 2.5 (snapshot unspecified)": "gemini-2-5-flash-image-preview-nano-banana", "Gemini 2.5": "gemini-2-5-flash-image-preview-nano-banana", "Wan2.6": "wan-2-6-image"},
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const table = tables.find(t => t[1]?.join('|') === header.join('|') && t[0][2] === 'Overall' && t[0][4].startsWith('SLR'));
    if (!table) throw new Error('The reviewed results table is missing');
    const rows: LeaderboardRow[] = [];
    for (const row of table.slice(2)) {
      if (row[0] === 'All') continue;
      const model = row[0];
      const metrics = Object.fromEntries(Object.entries(columns).map(([key, i]) => [key, numberCell(row[i])]));
      const score = numberCell(row[2]);
      rows.push({ model, score, metrics, trials: numberCell(row[1]) });
    }
    return checked(rows, 6);
  },
};
export default board;
