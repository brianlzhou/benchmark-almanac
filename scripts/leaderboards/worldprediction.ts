// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// Table 2 reports accuracy on world modeling and procedural planning.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, flatPaperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2506.04363';
const board: Leaderboard = {
  benchmark: 'worldprediction',
  url: feed,
  feed,
  static: 'paper',
  terms: 'The authors publish these results under the terms linked at https://arxiv.org/abs/2506.04363.',
  headline: 'The paper reports no overall score, so this is the plain mean of world modeling and procedural planning accuracy.',
  parts: { wm: 'WorldPrediction-WM', pp: 'WorldPrediction-PP' },
  aliases: {
    "InternVL2.5 (2B)": "internvl2-5-2b",
    "InternVL2.5 (4B)": "internvl2-5-4b",
    "InternVL2.5 (26B)": "internvl2-5-26b",
    "InternVL2.5 (38B)": "internvl2-5-38b",
    "Qwen2.5-VL (3B)": "qwen2-5-vl-3b",
    "Qwen2.5-VL (7B)": "qwen2-5-vl-7b",
    "Qwen2.5-VL (32B)": "qwen2-5-vl-32b",
    "Qwen2.5-VL (72B)": "qwen2-5-vl-72b",
    "Llama-3.1 (8B)": "llama-3-1-8b",
    "Llama-3.1 (70B)": "llama-3-1-70b",
    "Llama-3.3 (70B)": "llama-3-3-70b",
    "Qwen2.5 (3B)": "qwen2-5-3b",
    "Qwen2.5 (7B)": "qwen2-5-7b",
    "Qwen2.5 (32B)": "qwen2-5-32b",
    "Qwen2.5 (72B)": "qwen2-5-72b"
},
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const table = tables.find(table => table[0].join('|') === 'World Model / Planner|World Model / Planner|WorldPrediction - WM|WorldPrediction - PP');
    if (!table) throw new Error('Missing reviewed results columns');
    const rows: LeaderboardRow[] = [];
    for (const cells of table.slice(1)) {
      const [, model, wmCell, ppCell] = cells;
      if ([wmCell, ppCell].some(value => value === '' || value === 'N/A')) continue;
      const wm = numberCell(wmCell), pp = numberCell(ppCell);
      const socratic = !/^(InternVL|Qwen2\.5-VL)/.test(model);
      rows.push({ model, ...(socratic ? { harness: 'Socratic LLM' } : {}), score: (wm + pp) / 2, metrics: { wm, pp } });
    }
    return checked(rows, 21);
  },
};
export default board;
