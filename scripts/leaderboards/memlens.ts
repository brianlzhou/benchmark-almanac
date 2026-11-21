// The source reports no overall score. The headline is the plain mean of the 3 parts, computed by this importer.
// Table 12 scores multimodal conversational memory on all 789 questions at 32K, 64K and 128K context lengths.
import type { Leaderboard } from './types.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2605.14906';
const lengths = ['32K','64K','128K'];
const fields = ['IE','MSR','TR','KU','AR','Ov.'];
const names = ['Information Extraction','Multi-Session Reasoning','Temporal Reasoning','Knowledge Update','Answer Refusal','Overall'];
const board: Leaderboard = {
  benchmark: 'memlens', static: 'paper', url: feed, feed,
  terms: 'The authors publish their paper under the terms at https://arxiv.org/abs/2605.14906.',
  headline: 'The headline averages full-benchmark accuracy at 32K, 64K and 128K context lengths.',
  aliases: { 'Phi4-Multimodal': 'phi-4-multimodal',
    'Qwen3-VL-235B (I)': 'qwen3-vl-235b-a22b-instruct', 'Qwen3-VL-235B (T)': 'qwen3-vl-235b-a22b',
    'Qwen3-VL-30B (I)': 'qwen3-vl-30b-a3b-instruct', 'Qwen3-VL-30B (T)': 'qwen3-vl-30b-a3b-thinking',
    'Qwen3-VL-8B (I)': 'qwen3-vl-8b-instruct', 'Qwen3-VL-8B (T)': 'qwen3-vl-8b-thinking',
    'Qwen3-VL-4B (I)': 'qwen3-vl-4b-instruct', 'Qwen3-VL-4B (T)': 'qwen3-vl-4b-thinking',
    'Qwen3-VL-2B (I)': 'qwen3-vl-2b-instruct', 'Qwen3-VL-2B (T)': 'qwen3-vl-2b-thinking' },
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t =>
      t[0]?.join('|') === ['',...lengths.flatMap(length => fields.map(() => length))].join('|'));
    if (table?.[1]?.join('|') !== ['Model',...lengths.flatMap(() => fields)].join('|')) throw new Error('Missing Table 12 columns');
    const parts: NonNullable<Leaderboard['parts']> = {};
    const rows = table.slice(2).flatMap(([model,...cells]) => {
      if (cells.length !== 18) throw new Error('Missing context length');
      if (cells.some(c => c === '—')) return [];
      const metrics: Record<string,number> = {};
      lengths.forEach((length,i) => fields.forEach((field,j) => {
        const key = field === 'Ov.' ? length : length + field;
        parts[key] = { name: field === 'Ov.' ? length : names[j], group: field === 'Ov.' ? 'Context length' : length };
        metrics[key] = numberCell(cells[i*fields.length+j]);
      }));
      return [{ model, metrics, score: lengths.reduce((sum,k) => sum + metrics[k],0)/lengths.length }];
    });
    board.parts = parts;
    return checked(rows,25);
  },
};
export default board;
