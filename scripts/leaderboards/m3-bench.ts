// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// Table 5 reports long-video question answering accuracy on M3-Bench-robot and M3-Bench-web.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2508.09736';
const types = ['Multi-evidence reasoning', 'Multi-hop reasoning', 'Cross-modal reasoning', 'Person understanding', 'General knowledge extraction'];
const board: Leaderboard = {
  benchmark: 'm3-bench', static: 'paper', url: feed, feed,
  headline: 'The paper gives no overall accuracy, so this is the plain mean of M3-Bench-robot and M3-Bench-web accuracy.',
  terms: 'The authors publish these results under the terms linked at https://arxiv.org/abs/2508.09736.',
  parts: Object.fromEntries(['robot', 'web'].flatMap(split => [
    [split, 'M3-Bench-' + split],
    ...types.map((name, i) => [split + i, {name, group: 'M3-Bench-' + split}]),
  ])),
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const table = tables.find(t => t[0][0] === 'Method' && t[0][6] === 'M3-Bench-robot' && t[0][12] === 'M3-Bench-web'
      && t[1].slice(1, 13).join('|') === 'ME|MH|CM|PU|GK|All|ME|MH|CM|PU|GK|All');
    if (!table) throw new Error('Missing M3-Bench accuracy columns');
    const rows: LeaderboardRow[] = [];
    let group = '';
    for (const cells of table.slice(2)) {
      if (cells[0] === cells[1]) { group = cells[0]; continue; }
      const [model, ...values] = cells;
      const robot = numberCell(values[5]), web = numberCell(values[11]);
      const metrics: Record<string, number> = { robot, web };
      for (let i = 0; i < types.length; i++) {
        metrics['robot' + i] = numberCell(values[i]);
        metrics['web' + i] = numberCell(values[6 + i]);
      }
      rows.push({ model, score: (robot + web) / 2, metrics,
        ...(group === 'Socratic Model' ? { harness: group } : {}),
        ...(model === 'Gemini-GPT4o-Hybrid' ? { models: ['Gemini-1.5-Pro', 'GPT-4o'] } : {}) });
    }
    return checked(rows, 10);
  },
};
export default board;
