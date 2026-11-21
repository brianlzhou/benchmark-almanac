// HLE-VL is the visual subset of Humanity’s Last Exam. The WebWatcher paper gives accuracy
// by subject and average accuracy across three runs in Table 1.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = "https://arxiv.org/html/2508.05748";

export default {
  benchmark: "hle-vl", static: 'paper', url: "https://arxiv.org/abs/2508.05748", feed,
  terms: "arXiv allows this HTML path in robots.txt. Results are credited to the paper authors. The paper lists http://arxiv.org/licenses/nonexclusive-distrib/1.0/.",
  parts: {"Bio": "Bio.", "Chem": "Chem.", "CSAI": "CS/AI", "Engineer": "Engineer.", "Human": "Human.", "Math": "Math", "Physics": "Physics", "Other": "Other"},
  reference: ['Direct Inference', 'Reasoning Model'], harnesses: 'system',
  async fetch() {
    const html = await paperHtml(feed);
    const tables = flatPaperTables(html.replace(/<cite\b[^>]*>[\s\S]*?<\/cite>/gi, '')).map(grid);
    const table = tables.find(table => table[0]?.join("|") === "Backbone|Humanity’s Last Exam (HLE-VL)|Humanity’s Last Exam (HLE-VL)|Humanity’s Last Exam (HLE-VL)|Humanity’s Last Exam (HLE-VL)|Humanity’s Last Exam (HLE-VL)|Humanity’s Last Exam (HLE-VL)|Humanity’s Last Exam (HLE-VL)|Humanity’s Last Exam (HLE-VL)|Humanity’s Last Exam (HLE-VL)" && table[1]?.join("|") === "Backbone|Bio.|Chem.|CS/AI|Engineer.|Human.|Math|Physics|Other|Avg.");
    if (!table) throw new Error('Missing result table or unexpected columns for hle-vl');
    const rows: LeaderboardRow[] = [];
    let group = '';
    for (const cells of table.slice(2)) {
      if (cells.every(v => v === cells[0])) {
        group = cells[0];
        continue;
      }
      if (cells.length !== 10 || !cells[0]) throw new Error("Incomplete result row");
      rows.push({
        model: cells[0], score: numberCell(cells[9]),
        trials: 3, harness: group === 'Open Source Agents' ? cells[0] : group,
        metrics: {
          "Bio": numberCell(cells[1]),
          "Chem": numberCell(cells[2]),
          "CSAI": numberCell(cells[3]),
          "Engineer": numberCell(cells[4]),
          "Human": numberCell(cells[5]),
          "Math": numberCell(cells[6]),
          "Physics": numberCell(cells[7]),
          "Other": numberCell(cells[8]),
        },
      });
    }
    if (rows.length < 17) throw new Error("Expected at least 17 results for hle-vl");
    return rows;
  },
} satisfies Leaderboard;
