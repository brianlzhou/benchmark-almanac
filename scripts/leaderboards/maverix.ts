// MAVERIX measures multiple-choice accuracy for each input modality. Table 3 of the paper reports accuracy in percent.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://arxiv.org/html/2503.21699';

const board: Leaderboard = {
  benchmark: 'maverix', static: 'paper',
  url: 'https://arxiv.org/abs/2503.21699',
  feed: FEED,
  terms: PAPER_TERMS,
  aliases: {"Gemini 2.0-FL": "gemini-2-0-flash-lite", "NOVA-Lite": "amazon-nova-lite", "NOVA-Pro": "amazon-nova-pro", "Qwen 2.5 Omni": "qwen2-5-omni-7b", "Qwen-2-VL": "qwen2-vl-7b-instruct", "Qwen-2.5-VL": "qwen2-5-vl-7b", "InternVL2": "internvl2-8b", "LLaVA-OneVision": "llava-onevision-7b", "DeepSeekVL2-small": "deepseek-vl2-small", "Claude Sonnet 3.5": "claude-3-5-sonnet"},
  async fetch() {
    const tables = flatPaperTables(await paperHtml(FEED)).map(grid);
    const table = tables.find(t => t[1]?.includes('Best-Multi'));
    if (!table || table[1].slice(5, 12).join('|') !== 'A|S|V|Best-Uni|V+S|V+A|Best-Multi') throw new Error('Missing modality columns');
    const rows: LeaderboardRow[] = [];
    for (const cells of table.slice(2)) {
      if (cells[0] === 'Human') continue;
      for (const col of [5, 6, 7, 9, 10]) {
        if (cells[col] === '–') continue;
        if (!/^\d+(?:\.\d+)?$/.test(cells[col])) throw new Error('Invalid MAVERIX accuracy');
        rows.push({ model: cells[0], setting: table[1][col], score: Number(cells[col]) });
      }
    }
    if (rows.length < 63) throw new Error('Incomplete modality results');
    return rows;
  },
};
export default board;
