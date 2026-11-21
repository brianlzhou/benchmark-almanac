// The source reports no overall score. The headline is the plain mean of the 55 parts, computed by this importer.
// OCBench evaluates behavioral cloning policies on simulated manipulation tasks.
// Table 6 gives success rates and standard deviations across two seeds for standard and lite task variants.
import type { Leaderboard } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2610.07056';
const board: Leaderboard = {
  benchmark: 'ocbench', url: feed, feed, static: 'paper',
  terms: 'The authors publish the benchmark under MIT at https://github.com/seohongpark/ocbench/blob/main/LICENSE.',
  headline: 'The paper reports no overall score, so this is the plain mean of the 55 task success rates in Table 6.',
  async fetch() {
    const html = await paperHtml(feed);
    const figure = [...html.matchAll(/<figure\b[^>]*>([\s\S]*?)<\/figure>/g)]
      .find(m => m[1].includes('Full benchmark results (success rate)'))?.[1];
    const table = figure && flatPaperTables(figure).map(grid)[0];
    if (!table || table[0]?.join('|') !== 'Task|BC|FBC|FSQBC' || table.length !== 56) throw new Error('OCBench success table changed');
    const tasks = table.slice(1);
    if (new Set(tasks.map(r => r[0])).size !== tasks.length) throw new Error('Duplicate OCBench task');
    board.parts = Object.fromEntries(tasks.map(([task]) => [task, task]));
    const rows = table[0].slice(1).map((model, i) => {
      const metrics: Record<string, number> = {};
      let total = 0;
      for (const row of tasks) {
        const value = row[i + 1].match(/^(\d+)\s*\\pm\s*(\d+)$/);
        if (!value) throw new Error('Missing OCBench success rate or standard deviation');
        metrics[row[0]] = Number(value[1]);
        metrics[row[0] + 'Std'] = Number(value[2]);
        total += Number(value[1]);
      }
      return { model, score: total / tasks.length, trials: 2, metrics };
    });
    return checked(rows, 3);
  },
};
export default board;
