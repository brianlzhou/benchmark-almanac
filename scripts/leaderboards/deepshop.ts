// DeepShop evaluates shopping queries on live websites. Table 2 gives task success as a percentage
// and three component scores for each agent or research system.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = "https://arxiv.org/html/2506.02839";

export default {
  benchmark: "deepshop", static: 'paper', url: "https://arxiv.org/abs/2506.02839", feed,
  terms: "arXiv allows this HTML path in robots.txt. Results are credited to the paper authors. The paper lists http://arxiv.org/licenses/nonexclusive-distrib/1.0/.",
  parts: {"Productattribute": "Product attribute", "Searchfilter": "Search filter", "Sortingpreference": "Sorting preference"},
  harnesses: 'system',
  async fetch() {
    const html = await paperHtml(feed);
    const tables = flatPaperTables(html.replace(/<cite\b[^>]*>[\s\S]*?<\/cite>/gi, '')).map(grid);
    const table = tables.find(table => table[0]?.join("|") === "Method|Product attribute|Search filter|Sorting preference|Task success");
    if (!table) throw new Error('Missing result table or unexpected columns for deepshop');
    const rows: LeaderboardRow[] = [];
    for (const cells of table.slice(1)) {
      if (['Simple RAG', 'Web agents', 'Deep research systems'].includes(cells[0])) continue;
      // The paper uses a phantom zero to align one-digit percentages.
      for (let i = 1; i < cells.length; i++) cells[i] = cells[i].replace(/^0 (?=\d\.)/, '');
      if (cells.length !== 5 || !cells[0]) throw new Error("Incomplete result row");
      rows.push({
        model: cells[0], score: numberCell(cells[4]),
        harness: cells[0],
        metrics: {
          "Productattribute": numberCell(cells[1]),
          "Searchfilter": numberCell(cells[2]),
          "Sortingpreference": numberCell(cells[3]),
        },
      });
    }
    if (rows.length < 7) throw new Error("Expected at least 7 results for deepshop");
    return rows;
  },
} satisfies Leaderboard;
