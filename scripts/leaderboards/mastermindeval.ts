// The source reports no overall score. The headline is the plain mean of the 6 parts, computed by this importer.
// Tables 3 and 4 measure multiple-choice accuracy for three code sizes with random or close incorrect answers.
import type { Leaderboard } from './types.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2503.05891';
const configs = ['(c=2, n=4)', '(c=3, n=5)', '(c=4, n=6)'];
const board: Leaderboard = {
  benchmark: 'mastermindeval', static: 'paper', url: feed, feed,
  terms: 'The authors publish their paper under the terms at https://arxiv.org/abs/2503.05891.',
  headline: 'The headline averages multiple-choice accuracy across three code sizes and two types of incorrect answer.',
  aliases: { 'Phi-4 14B': 'phi-4', 'Phi-3.5 (mini) 3.8B': 'phi-3-5-mini',
    'Qwen-2.5 (R1) 7B': 'deepseek-r1-distill-qwen-7b', 'Qwen-2.5 (R1) 1.5B': 'deepseek-r1-distill-qwen-1-5b' },
  async fetch() {
    const html = await paperHtml(feed);
    const figures = [...html.matchAll(/<figure\b[^>]*class="ltx_table"[^>]*>([\s\S]*?)<\/figure>/g)].map(m => m[1]);
    const byModel = new Map<string, Record<string, number>>();
    const parts: NonNullable<Leaderboard['parts']> = {};
    for (const type of ['random', 'close']) {
      const figure = figures.find(s => s.includes(type + ' codes as wrong'));
      const table = figure && paperTables(figure).map(grid)[0];
      if (!table || table[1].join('|') !== ['Model', 'Params', ...configs].join('|')) throw new Error('Missing multiple-choice results');
      let family = '';
      for (const [name, size, ...cells] of table.slice(2)) {
        family = name || family;
        if (!family || !size || cells.length !== 3) throw new Error('Incomplete model or configuration');
        const model = family + ' ' + size;
        const metrics = byModel.get(model) ?? {};
        cells.forEach((v, i) => {
          const key = type + i;
          parts[key] = { name: configs[i], group: type === 'random' ? 'Random incorrect answers' : 'Close incorrect answers' };
          metrics[key] = numberCell(v) * 100;
        });
        byModel.set(model, metrics);
      }
    }
    board.parts = parts;
    return checked([...byModel].flatMap(([model, metrics]) => Object.keys(metrics).length === 6
      ? [{ model, params: Number(model.match(/([0-9.]+)B$/)![1]), metrics, score: Object.values(metrics).reduce((a,b) => a+b,0)/6 }] : []), 8);
  },
};
export default board;
