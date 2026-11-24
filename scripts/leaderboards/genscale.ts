// The source reports no overall score. The headline is the plain mean of the 3 parts, computed by this importer.
// GenScale tests relative object scale in image generation and editing. Each task reports a scale error.
// The project page pools the two scenarios within Tasks 1 and 3. Lower error is better on every task.
import type { Leaderboard, LeaderboardRow, BoardPart } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://lingxiao-li.github.io/genscale/';
const tasks = ['Task 1', 'Task 2', 'Task 3'];
const parts: Record<string, BoardPart> = Object.fromEntries(tasks.map(name => [name, { name: name + ' scale error', unit: 'score', better: 'lower' }]));
const board: Leaderboard = {
  benchmark: 'genscale', feed, url: feed, parts,
  terms: 'GenScale project results and CC BY 4.0 dataset: https://huggingface.co/datasets/lingxiao2049/GenScale/blob/main/LICENSE',
  headline: 'The project reports no overall score. The headline is the plain mean of scale error across three tasks, where lower is better.',
  aliases: { 'Nano Banana 2': 'gemini-3-1-flash-image' },
  async fetch() {
    const grids = paperTables(await fetchText(feed)).map(grid);
    const generation = grids.find(t => t[0]?.[7] === 'S1 + S2' && t[1]?.[7] === 'Err. ↓');
    const product = grids.find(t => t[0]?.[2] === 'Scale error ↓');
    const editing = grids.find(t => t[0]?.[8] === 'S4 + S5' && t[1]?.[8] === 'Err. ↓');
    if (!generation || !product || !editing) throw Error('Missing scale-error columns');
    const rows: LeaderboardRow[] = [];
    for (const cells of generation.slice(2)) {
      const model = cells[0];
      const task2 = product.slice(1).find(r => r[0] === model);
      const task3 = editing.slice(2).find(r => r[0] === model);
      if (!task2 || !task3) continue;
      const values = [cells[7], task2[2], task3[8]].map(s => s?.trim() ? Number(s) : NaN);
      if (!values.every(Number.isFinite)) throw Error('Invalid scale errors for ' + model);
      rows.push({ model, score: values.reduce((a,b) => a+b,0)/3, metrics: Object.fromEntries(tasks.map((name,i) => [name, values[i]])) });
    }
    return checked(rows,2);
  },
};
export default board;
