// LegalRewardBench tests whether models prefer the better answer to a Chinese legal task.
// Table 3 reports overall accuracy and accuracy at each of five capability levels.
import type { Leaderboard } from './types.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2610.18299';
const board: Leaderboard = {
  benchmark: 'legalrewardbench', static: 'paper', feed, url: feed,
  terms: 'The authors publish their paper under the terms at https://arxiv.org/abs/2610.18299.',
  parts: { l1: 'L1 Knowledge', l2: 'L2 Understanding', l3: 'L3 Analysis', l4: 'L4 Decision', l5: 'L5 Writing' },
  aliases: { 'Qwen3-30B-A3B': 'qwen3-30b-a3b-thinking-jul-2025', 'Kimi-K2': 'kimi-k2-sep-2025',
    'DeepSeek-R1 (snapshot unspecified)': 'deepseek-r1', 'DeepSeek-v3.2 (snapshot unspecified)': 'deepseek-v3-2' },
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(rows =>
      rows[0]?.join('|') === 'Model|Type|TK|Overall|L1|L2|L3|L4|L5');
    if (!table) throw new Error('Missing LegalRewardBench main results');
    return checked(table.slice(1).map(([model, , thinking, ...cells]) => {
      if (cells.length !== 6 || !['✓', '✗', '–'].includes(thinking)) throw new Error('Invalid main result');
      const [score, l1, l2, l3, l4, l5] = cells.map(numberCell);
      const setting = thinking === '–' ? undefined : thinking === '✓' ? 'Thinking on' : 'Thinking off';
      return { model, setting, score, metrics: { l1, l2, l3, l4, l5 } };
    }), 38);
  },
};
export default board;
