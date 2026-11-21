// Agents reproduce historical NanoGPT speedups with hints of varying detail.
// Table 3 gives the mean fraction of speedup recovered and its standard deviation over three runs.
import type { Leaderboard } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2506.22419';
const board: Leaderboard = {
  benchmark: 'automated-llm-speedrunning-benchmark-meta', static: 'paper', url: feed, feed,
  terms: 'Meta releases the benchmark under CC BY-NC 4.0. https://github.com/facebookresearch/llm-speedrunner',
  async fetch() {
    const header = ['Hints', 'Model', 'Flat', 'Tree', 'Forest', 'AIDE', 'Multi-AIDE'];
    const table = paperTables(await paperHtml(feed)).map(grid).find(t => t[0].join('|') === header.join('|'));
    if (!table) throw new Error('Missing Table 3');
    const rows = table.slice(1).flatMap(([setting, model, ...cells]) => cells.map((cell, i) => {
      const match = /^([\d.]+)\s*\\pm\s*([\d.]+)/.exec(cell);
      if (!match) throw new Error('Missing mean or standard deviation for ' + model);
      return { model, setting, harness: header[i + 2], score: Math.round(Number(match[1]) * 100), trials: 3,
        metrics: { std: Math.round(Number(match[2]) * 100) } };
    }));
    return checked(rows, 100);
  },
};
export default board;
