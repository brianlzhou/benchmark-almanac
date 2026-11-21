// TIR-Bench tests image reasoning across 13 tasks. Table 2 reports overall accuracy under All,
// with one accuracy per task and separate runs for models using a code interpreter.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = "https://arxiv.org/html/2511.01833";

export default {
  benchmark: "tir-bench", static: 'paper', url: "https://arxiv.org/abs/2511.01833", feed,
  terms: "arXiv allows this HTML path in robots.txt. Results are credited to the paper authors. The paper lists http://creativecommons.org/licenses/by/4.0/.",
  aliases: {"Llava-1.6-M-7B": "llava-v1-6-mistral-7b", "Llava-1.6-V-7B": "llava-v1-6-vicuna-7b", "Llava-1.6-34B": "llava-v1-6-34b", "o3-TU": "o3", "o4-mini-TU": "o4-mini"},
  parts: {"Color": "Color", "Pro": "Pro.", "OCR": "OCR", "SR": "SR", "Maze": "Maze", "Math": "Math", "WS": "WS", "LLVQA": "LL-VQA", "IR": "IR", "SD": "SD", "JG": "JG", "VS": "VS", "RG": "RG"},
  async fetch() {
    const html = await paperHtml(feed);
    const tables = flatPaperTables(html.replace(/<cite\b[^>]*>[\s\S]*?<\/cite>/gi, '')).map(grid);
    const table = tables.find(table => table[0]?.join("|") === "Model|All|Color|Pro.|OCR|SR|Maze|Math|WS|LL-VQA|IR|SD|JG|VS|RG");
    if (!table) throw new Error('Missing result table or unexpected columns for tir-bench');
    const rows: LeaderboardRow[] = [];
    let group = '';
    for (const cells of table.slice(1)) {
      if (cells[0] === 'Random Guess') continue;
      if (cells.every(v => v === cells[0])) {
        group = cells[0];
        continue;
      }
      if (cells.length !== 15 || !cells[0]) throw new Error("Incomplete result row");
      rows.push({
        model: cells[0], score: numberCell(cells[1]),
        ...(group === 'Tool-Using MLLMs' ? { setting: 'Tool-using' } : { open: group === 'Open-Source MLLMs' }),
        metrics: {
          "Color": numberCell(cells[2]),
          "Pro": numberCell(cells[3]),
          "OCR": numberCell(cells[4]),
          "SR": numberCell(cells[5]),
          "Maze": numberCell(cells[6]),
          "Math": numberCell(cells[7]),
          "WS": numberCell(cells[8]),
          "LLVQA": numberCell(cells[9]),
          "IR": numberCell(cells[10]),
          "SD": numberCell(cells[11]),
          "JG": numberCell(cells[12]),
          "VS": numberCell(cells[13]),
          "RG": numberCell(cells[14]),
        },
      });
    }
    if (rows.length < 22) throw new Error("Expected at least 22 results for tir-bench");
    return rows;
  },
} satisfies Leaderboard;
