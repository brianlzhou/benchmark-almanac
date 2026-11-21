// The source reports no overall score. The headline is the plain mean of the 4 parts, computed by this importer.
// Tables II and III compare imitation learning policies on the same four tasks with state or RGB observations.
import type { Leaderboard } from './types.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const tasks = ['PickCube-v1', 'PushCube-v1', 'StackCube-v1', 'PegInsertionSide-v1'];
const feed = 'https://arxiv.org/html/2410.00425';
const board: Leaderboard = {
  benchmark: 'maniskill3', static: 'paper', feed, url: feed,
  terms: 'The authors publish their baseline comparison under the terms at https://arxiv.org/abs/2410.00425.',
  headline: 'The headline averages success rates on the four tasks in the paper’s imitation learning comparison.',
  parts: Object.fromEntries(tasks.map(name => [name, name])),
  async fetch() {
    const html = await paperHtml(feed);
    const figures = [...html.matchAll(/<figure\b[^>]*class="ltx_table"[^>]*>([\s\S]*?)<\/figure>/g)].map(m => m[1]);
    const rows = ['state', 'RGB'].flatMap(mode => {
      const figure = figures.find(s => s.includes('using ' + mode + ' observations'));
      const table = figure && paperTables(figure).map(grid)[0];
      if (!table || table[0].join('|') !== ['', ...tasks.flatMap(t => [t, t])].join('|') ||
          table[1].join('|') !== '|Demos|Success|Demos|Success|Demos|Success|Demos|Success') throw new Error('Missing imitation learning comparison');
      return table.slice(2).map(([model, ...cells]) => {
        if (cells.length !== 8 || !tasks.every((_, i) => cells[2*i] === cells[0])) throw new Error('Inconsistent demonstrations');
        const metrics = Object.fromEntries(tasks.map((task, i) => [task, 100 * numberCell(cells[2*i+1])]));
        return { model, setting: mode + ' observations, ' + cells[0] + ' demonstrations', metrics,
          score: Object.values(metrics).reduce((a, b) => a + b, 0) / tasks.length };
      });
    });
    return checked(rows, 12);
  },
};
export default board;
