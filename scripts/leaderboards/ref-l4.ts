// Ref-L4 measures grounding accuracy for long referring expressions. Table 4 reports mean accuracy
// on the combined validation and test set. Table 5 groups results by object size.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = "https://arxiv.org/html/2406.16866";

export default {
  benchmark: "ref-l4", static: 'paper', url: "https://arxiv.org/abs/2406.16866", feed,
  terms: "arXiv allows this HTML path in robots.txt. Results are credited to the paper authors. The paper lists http://arxiv.org/licenses/nonexclusive-distrib/1.0/.",
  parts: {"Val": "Val", "Test": "Test", small: "Small Size", medium: "Medium Size", large: "Large Size"},
  async fetch() {
    const html = await paperHtml(feed);
    const tables = flatPaperTables(html.replace(/<cite\b[^>]*>[\s\S]*?<\/cite>/gi, '')).map(grid);
    const table = tables.find(table => table[0]?.join("|") === "Model|Val+Test|Val+Test|Val+Test|Val+Test|Val|Test" && table[1]?.join("|") === "Model|Acc 0.5|Acc 0.75|Acc 0.9|mAcc|mAcc|mAcc");
    if (!table) throw new Error('Missing result table or unexpected columns for ref-l4');
    const rows: LeaderboardRow[] = [];
    const sizes = tables.find(t => t[0]?.join('|') === 'Model|Small Size|Small Size|Medium Size|Medium Size|Large Size|Large Size' && t[1]?.join('|') === 'Model|Acc 0.5|mAcc|Acc 0.5|mAcc|Acc 0.5|mAcc');
    if (!sizes) throw new Error('Missing Ref-L4 scale-aware results');
    for (const cells of table.slice(2)) {
      const detail = sizes.find(r => r[0] === cells[0]);
      if (detail?.length !== 7) throw new Error('Missing Ref-L4 object sizes for ' + cells[0]);
      cells[0] = cells[0].replace(/\s*†$/, '');
      if (cells.length !== 7 || !cells[0]) throw new Error("Incomplete result row");
      rows.push({
        model: cells[0], score: numberCell(cells[4]),
        metrics: {
          acc50: numberCell(cells[1]), acc75: numberCell(cells[2]), acc90: numberCell(cells[3]),
          small: numberCell(detail[2]), medium: numberCell(detail[4]), large: numberCell(detail[6]),
          smallAcc50: numberCell(detail[1]), mediumAcc50: numberCell(detail[3]), largeAcc50: numberCell(detail[5]),
          "Val": numberCell(cells[5]),
          "Test": numberCell(cells[6]),
        },
      });
    }
    if (rows.length < 24) throw new Error("Expected at least 24 results for ref-l4");
    return rows;
  },
} satisfies Leaderboard;
