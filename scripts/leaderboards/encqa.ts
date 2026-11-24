// EncQA tests how models read charts across visual encodings and tasks.
// Table 4 gives the EncQA Score and accuracy for each task and encoding pair.
import type { Leaderboard } from './types.ts';
import { tables } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2508.04650';
const board: Leaderboard = {
  benchmark: 'encqa', static: 'paper', url: feed, feed,
  terms: 'The authors publish Table 4 under the terms listed at https://arxiv.org/abs/2508.04650.',
  aliases: { 'Phi 3.5': 'phi-3-5-vision-instruct', 'InternVL2 26B': 'internvl2-26b', 'Molmo 7B-D': 'molmo-7b-d', 'OpenAI o1': 'o1' },
  async fetch() {
    const table = tables(await paperHtml(feed)).find(t => t[0][0]?.text === 'Task' &&
      t[0][1]?.text === 'Encoding' && t.at(-1)?.[0].text === 'EncQA Score');
    if (!table) throw new Error('EncQA results table missing');
    const percent = (cell: string) => Number((100 * numberCell(cell)).toFixed(4));
    const rows = table[0].slice(2).map((cell, i) => ({ model: cell.text,
      score: percent(table.at(-1)![i + 2].text), metrics: {} as Record<string, number> }));
    let task = '';
    const parts: Record<string, string> = {};
    for (const cells of table.slice(1, -1)) {
      task = cells[0].text || task;
      const part = task + ': ' + cells[1].text;
      if (!task || !cells[1].text || part in parts || cells.length !== rows.length + 2) throw new Error('Invalid EncQA task or encoding');
      parts[part] = part;
      rows.forEach((row, i) => { row.metrics[part] = percent(cells[i + 2].text); });
    }
    if (Object.keys(parts).length !== 44) throw new Error('Expected 44 EncQA task and encoding pairs');
    board.parts = parts;
    return checked(rows, 5);
  },
};
export default board;
