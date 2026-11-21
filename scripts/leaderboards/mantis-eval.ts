// Mantis-Eval tests reasoning across interleaved images. Table 5 of the Mantis paper reports
// accuracy on the 217 questions in the Mantis-Eval column.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = "https://arxiv.org/html/2405.01483";

export default {
  benchmark: "mantis-eval", static: 'paper', url: "https://arxiv.org/abs/2405.01483", feed,
  terms: "arXiv allows this HTML path in robots.txt. Results are credited to the paper authors. The paper lists http://creativecommons.org/licenses/by/4.0/.",
  aliases: { 'LLaVA-v1.5': 'llava-v1-5-7b', Fuyu: 'fuyu-8b', VideoLLaVA: 'video-llava-7b', 'VILA-1.5': 'llama-3-vila1-5-8b' },
  async fetch() {
    const html = await paperHtml(feed);
    const tables = flatPaperTables(html.replace(/<cite\b[^>]*>[\s\S]*?<\/cite>/gi, '')).map(grid);
    const table = tables.find(table => table[0]?.join("|") === "Models|Size|NLVR2|Q-Bench|Mantis-Eval|BLINK|MVBench|MileBench|MuirBench|MMIU");
    if (!table) throw new Error('Missing result table or unexpected columns for mantis-eval');
    const rows: LeaderboardRow[] = [];
    let layout: string | undefined;
    for (const cells of table.slice(1)) {
      if (cells[0].startsWith('Open Source Models')) {
        layout = cells[0].match(/\((.*?)\)/)?.[1];
        continue;
      }
      if (cells[0] === 'Random' || cells[0].endsWith('over SOTA')) continue;
      cells[4] = cells[4].replace(/\s/g, '');
      if (cells.length !== 10 || !cells[0]) throw new Error("Incomplete result row");
      rows.push({
        model: cells[0], score: numberCell(cells[4]),
        ...(cells[1] === '-' ? {} : { params: numberCell(cells[1].replace(/B$/, '')), open: true, setting: layout }),
      });
    }
    if (rows.length < 21) throw new Error("Expected at least 21 results for mantis-eval");
    return rows;
  },
} satisfies Leaderboard;
