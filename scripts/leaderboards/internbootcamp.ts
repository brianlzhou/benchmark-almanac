// InternBootcamp tests verifiable reasoning on generated tasks. Table 5 reports the overall Bootcamp-Eval score and eight category scores.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = "https://arxiv.org/html/2508.08636";
const header = ["Model", "Graph. Puzzles", "Algo", "Logic", "Crypto- Graphy", "Math", "Character Puzzles", "Natural Science", "Language Analysis", "Overall"];
const columns: Record<string, number> = {"Graph. Puzzles": 1, "Algo": 2, "Logic": 3, "Crypto- Graphy": 4, "Math": 5, "Character Puzzles": 6, "Natural Science": 7, "Language Analysis": 8};
const board: Leaderboard = {
  benchmark: "internbootcamp", url: feed, feed, static: 'paper',
  terms: "The authors publish this table under the terms linked at https://arxiv.org/abs/2508.08636." ,
  parts: {"Graph. Puzzles": "Graphical Puzzles", "Algo": "Algorithm", "Logic": "Logic", "Crypto- Graphy": "Cryptography", "Math": "Math", "Character Puzzles": "Character Puzzles", "Natural Science": "Natural Science", "Language Analysis": "Language Analysis"},
  aliases: {"DS-R1-Distilled-Qwen-32B": "deepseek-r1-distill-qwen-32b", "DeepSeek-V3-0324": "deepseek-v3-mar-2025"},
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const table = tables.find(t => t[0]?.join('|') === header.join('|'));
    if (!table) throw new Error('The reviewed results table is missing');
    const rows: LeaderboardRow[] = [];
    let backbone = '';
    let open = false;
    for (const row of table.slice(1)) {
      if (row.every(value => value === row[0])) {
        open = row[0] === 'SOTA Open Source LLMs';
        continue;
      }
      const setting = row[0].startsWith('+ ') ? row[0].slice(2) : undefined;
      if (!setting) backbone = row[0];
      const model = backbone;
      const metrics = Object.fromEntries(Object.entries(columns).map(([key, i]) => [key, numberCell(row[i])]));
      const score = numberCell(row[9]);
      rows.push({ model, score, metrics, setting, open: open ? true : undefined });
    }
    return checked(rows, 11);
  },
};
export default board;
