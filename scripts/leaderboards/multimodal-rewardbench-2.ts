// MMRB2 measures judges' agreement with expert preferences across four multimodal tasks.
// The authors publish each task accuracy and the average percentage in their README.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
const feed = "https://raw.githubusercontent.com/facebookresearch/MMRB2/HEAD/README.md";
const board: Leaderboard = {
  benchmark: 'multimodal-rewardbench-2',
  url: "https://github.com/facebookresearch/MMRB2",
  feed,
  terms: "GitHub robots.txt directs crawlers to its API. The authors release data under CC BY-NC 4.0 for benchmarking and retain third-party restrictions.",
  async fetch() {
    const table = markdownTables(await fetchText(feed)).find(t => t[0][0] === 'Judge');
    if (!table || table[0].join('|') !== 'Judge|Text-to-Image|Image Editing|Interleaved|Reasoning|Avg.') throw new Error('Missing judge result columns');
    const keys = table[0].slice(1, -1);
    board.parts = Object.fromEntries(keys.map(k => [k, k]));
    const rows: LeaderboardRow[] = [];
    let open = true;
    for (const cells of table.slice(1)) {
      if (cells.length === 1) { open = !cells[0].includes('API-based'); continue; }
      if (cells.length !== 6) throw new Error('Invalid judge row');
      if (cells[5] === '-') continue;
      if (!cells.slice(1).every(v => v !== '' && Number.isFinite(Number(v)))) throw new Error('Invalid judge accuracy');
      rows.push({ model: cells[0], score: Number(cells[5]), open,
        metrics: Object.fromEntries(keys.map((k, i) => [k, Number(cells[i + 1])])) });
    }
    if (rows.length < 15) throw new Error('Missing judges with overall scores');
    return rows;
  },
};
export default board;
