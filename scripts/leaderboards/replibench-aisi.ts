// The source reports no overall score. The headline is the plain mean of the 20 parts, computed by this importer.
// RepliBench evaluates autonomous replication capabilities. Table 2 gives pass@10 for each task family.
// Appendix Table 3 gives pass@1 on the same families. Parentheses give the worst variant.
import type { Leaderboard } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2504.18565';
const board: Leaderboard = {
  benchmark: 'replibench-aisi', static: 'paper', url: feed, feed,
  terms: 'The paper license is listed at https://arxiv.org/abs/2504.18565.',
  headline: 'The paper reports no overall score, so this is the plain mean of pass@10 across 20 task families.',
  async fetch() {
    const html = await paperHtml(feed);
    const rows = new Map<string, Record<string, number>>();
    const parts: Record<string, string> = {}, stats: NonNullable<Leaderboard['stats']> = {};
    for (const [id, label] of [['S4.T2', 'Pass@10'], ['A3.T3', 'Pass@1']]) {
      const fig = html.match(/<figure\b[^>]*>[\s\S]*?<\/figure>/g)?.find(f => f.startsWith('<figure id="' + id + '"'));
      const table = fig && paperTables(fig).map(grid)[0];
      if (!table || table[0][0] !== 'Task' || !fig.includes(label)) throw new Error('Missing RepliBench ' + label);
      for (const [task, ...values] of table.slice(1)) {
        if (values.every(v => v === task)) continue;
        if (values.length !== table[0].length - 1) throw new Error('RepliBench family width changed');
        values.forEach((cell, i) => {
          const match = cell.match(/^(\d+\.\d+)(?: \((\d+\.\d+)\))?(?: \*)?$/);
          if (!match) throw new Error('Invalid RepliBench result');
          const model = table[0][i + 1], metrics = rows.get(model) ?? {};
          const key = label === 'Pass@10' ? task : task + ': Pass@1';
          if (label === 'Pass@10') parts[key] = key;
          else stats[key] = { name: key, unit: '%', better: 'higher' };
          metrics[key] = Math.round(Number(match[1]) * 100);
          if (match[2]) {
            const worst = task + ': Worst variant ' + label;
            metrics[worst] = Math.round(Number(match[2]) * 100);
            stats[worst] = { name: worst, unit: '%', better: 'higher' };
          }
          rows.set(model, metrics);
        });
      }
    }
    const families = Object.keys(parts);
    if (families.length !== 20) throw new Error('Expected 20 task families');
    board.parts = parts;
    board.stats = stats;
    return checked([...rows].map(([model, metrics]) => ({ model, metrics,
      score: families.reduce((sum, key) => sum + metrics[key], 0) / families.length })), 5);
  },
};
export default board;
