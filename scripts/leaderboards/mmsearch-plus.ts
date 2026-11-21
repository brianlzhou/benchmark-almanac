// MMSearch-Plus tests multimodal browsing. Table 1 reports accuracy for each search mode,
// with an average over all 311 questions and breakdowns by category and difficulty.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2508.21475';
const board: Leaderboard = {
  benchmark: 'mmsearch-plus', static: 'paper', url: 'https://arxiv.org/abs/2508.21475', feed, terms: PAPER_TERMS,
  aliases: { 'o3 (2025-04-16)': 'o3', 'Qwen-2.5-VL-72B': 'qwen2-5-vl-72b' },
  async fetch() {
    const html = await paperHtml(feed);
    const tables = flatPaperTables(html.replace(/<cite\b[^>]*>[\s\S]*?<\/cite>/gi, '')).map(grid);
    const table = tables.find(t => t[0]?.[0] === 'Model / Search Mode' && t[0][1] === 'Avg' && t[1]?.at(-1) === 'Hard');
    if (!table || table[1].length !== 12) throw new Error('Missing MMSearch-Plus category and difficulty columns');
    const parts = table[1].slice(2);
    board.parts = Object.fromEntries(parts.map(k => [k, k]));
    let model = '', open = false;
    const rows: LeaderboardRow[] = [];
    for (const [label, avg, ...values] of table.slice(2)) {
      if (label === 'Human' || label === 'Browser') continue;
      if (label === 'Open-source' || label === 'Closed-source') { open = label === 'Open-source'; continue; }
      if (!avg && values.every(v => !v)) { model = label; continue; }
      if (!model || values.length !== parts.length) throw new Error('Incomplete MMSearch-Plus result');
      rows.push({model, open, setting: label, score: numberCell(avg), metrics: Object.fromEntries(parts.map((k,i) => [k, numberCell(values[i])]))});
    }
    if (rows.length < 16) throw new Error('Missing MMSearch-Plus configurations');
    return rows;
  },
};
export default board;
