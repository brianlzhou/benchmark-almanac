// PixMo-Count measures exact object-count accuracy on natural images. Table 1 of the Molmo paper
// reports test accuracy alongside ten other benchmarks.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = "https://arxiv.org/html/2409.17146";

export default {
  benchmark: "pixmo-count", static: 'paper', url: "https://arxiv.org/abs/2409.17146", feed,
  terms: "arXiv allows this HTML path in robots.txt. Results are credited to the paper authors. The paper lists http://arxiv.org/licenses/nonexclusive-distrib/1.0/.",
  aliases: {"Phi3.5-Vision-4B": "phi-3-5-vision-instruct", "Qwen2-VL-72B": "qwen2-vl-72b-instruct", "Llama-3.2V-11B-Instruct": "llama-3-2-11b", "Llama-3.2V-90B-Instruct": "llama-3-2-90b", "GPT-4o-0513": "gpt-4o-may-2024", "LLaVA-1.5-7B": "llava-v1-5-7b", "LLaVA-1.5-13B": "llava-v1-5-13b"},
  async fetch() {
    const html = await paperHtml(feed);
    const tables = flatPaperTables(html.replace(/<cite\b[^>]*>[\s\S]*?<\/cite>/gi, '')).map(grid);
    const table = tables.find(table => table[0]?.join("|") === "model|AI2D test|ChartQA test|VQA v2.0 testdev|DocVQA test|InfoQA test|TextVQA val|RealWorldQA|MMMU val|MathVista testmini|CountBenchQA|PixMo-Count test|Average|Elo score|Elo rank");
    if (!table) throw new Error('Missing result table or unexpected columns for pixmo-count');
    const rows: LeaderboardRow[] = [];
    let open = false;
    for (const cells of table.slice(1)) {
      if (cells[0] === cells[1]) {
        open = cells[0] !== 'API call only';
        continue;
      }
      cells[0] = cells[0].replace(/\s*\\dagger$/, '');
      if (cells.length !== 15 || !cells[0]) throw new Error("Incomplete result row");
      rows.push({
        model: cells[0], score: numberCell(cells[11]),
        open,
      });
    }
    if (rows.length < 27) throw new Error("Expected at least 27 results for pixmo-count");
    return rows;
  },
} satisfies Leaderboard;
