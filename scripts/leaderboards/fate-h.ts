// FATE-H contains 100 formal algebra proofs. Table 1 reports pass@64 accuracy at a 64k token limit.
// The FATE-H panel of Table 9 supplies pass rates at smaller sample budgets.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = "https://arxiv.org/html/2511.02872";

export default {
  benchmark: "fate-h", static: 'paper', url: "https://arxiv.org/abs/2511.02872", feed,
  terms: "arXiv allows this HTML path in robots.txt. Results are credited to the paper authors. The paper lists http://creativecommons.org/licenses/by/4.0/.",
  async fetch() {
    const html = await paperHtml(feed);
    const tables = flatPaperTables(html.replace(/<cite\b[^>]*>[\s\S]*?<\/cite>/gi, '')).map(grid);
    const table = tables.find(t => t[1]?.[0] === 'Reasoning model' && t[0]?.includes('FATE-H'));
    if (!table) throw new Error('Missing result table or unexpected columns for fate-h');
    if (!(table[0]?.join("|") === "Model|FATE-M|FATE-H|FATE-X")) throw new Error("Unexpected score columns");
    const rows: LeaderboardRow[] = [];
    const panels = tables.filter(t => t[1]?.join('|') === 'Model|1|2|4|8|16|32|64');
    const panel = panels.find(t => t.find(r => r[0] === 'o3')?.[7]?.replace(/^0 /, '') === '3.0');
    if (!panel) throw new Error('Missing FATE-H pass@k panel');
    for (const cells of table.slice(1)) {
      if (cells.every(c => c === cells[0])) continue;
      cells[2] = cells[2].replace(/%$/, '');
      const label = cells[0].startsWith('Qwen3-') ? 'Qwen3' : cells[0];
      const series = panel.find(r => r[0].toLowerCase() === label.toLowerCase());
      if (series?.length !== 8) throw new Error('Missing pass@k series for ' + label);
      if (cells.length !== 4 || !cells[0]) throw new Error("Incomplete result row");
      rows.push({
        model: cells[0], score: numberCell(cells[2]),
        trials: 64, metrics: Object.fromEntries(panel[1].slice(1).map((k, i) => ['passAt' + k, numberCell(series[i + 1].replace(/^0 /, ''))])),
      });
    }
    if (rows.length < 8) throw new Error("Expected at least 8 results for fate-h");
    return rows;
  },
} satisfies Leaderboard;
