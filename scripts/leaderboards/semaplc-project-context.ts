// SemaPLC tests how well agents implement control logic within existing projects.
// Table II first reports integrated compilation on 65 tasks, then static and dynamic behavior.
import type { Leaderboard } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
const url = 'https://arxiv.org/html/2608.18565';
export default {
  benchmark: 'semaplc-project-context', static: 'paper', url, feed: url,
  terms: 'The authors publish Table II on arXiv. https://arxiv.org/abs/2608.18565',
  headline: 'The headline is the integrated compilation rate, the first of three separate measures in Table II.',
  parts: Object.fromEntries([{ key: 'staticBehavior', name: 'Static behavior', unit: '%' },
    { key: 'dynamicBehavior', name: 'Dynamic behavior', unit: '%' }].map(({ key, ...part }) => [key, part])),
  async fetch() {
    const table = paperTables(await paperHtml(url)).map(grid).find(t =>
      t[1]?.[0] === 'Method' && t[1]?.[8] === 'Worst' && t[2]?.[0] === 'Integrated compilation');
    if (!table) throw new Error('Missing Table II project-context results');
    const section = (name: string) => {
      const start = table.findIndex(r => r.every(s => s === name));
      if (start < 0) throw new Error('Missing section: ' + name);
      return table.slice(start + 1, start + 5);
    };
    const compilation = section('Integrated compilation');
    const staticRows = section('Static behavior');
    const dynamicRows = section('Dynamic behavior');
    const rows = compilation.flatMap((r, i) => {
      if (r[0] !== staticRows[i][0] || r[0] !== dynamicRows[i][0]) throw new Error('Harness mismatch');
      return table[1].slice(1, 8).map((name, j) => {
        const col = j + 1;
        return { model: [table[0][col], name].filter(Boolean).join(' '), harness: r[0],
          score: numberCell(r[col]), metrics: { staticBehavior: numberCell(staticRows[i][col]),
            dynamicBehavior: numberCell(dynamicRows[i][col]) } };
      });
    });
    return checked(rows, 28);
  },
} satisfies Leaderboard;
