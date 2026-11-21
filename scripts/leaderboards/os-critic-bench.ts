// OS-Critic Bench tests whether a model can judge GUI task trajectories.
// Table 1 reports overall accuracy and F1, with both measures for each platform.
import type { Leaderboard } from './types.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2512.16295';
const platforms = ['Mobile', 'Desktop', 'Web'];
const board: Leaderboard = {
  benchmark: 'os-critic-bench', static: 'paper', url: feed, feed,
  terms: 'The authors publish Table 1 on arXiv under the terms linked at https://arxiv.org/abs/2512.16295.',
  stats: { f1: { name: 'Overall F1', unit: '%', better: 'higher' } },
  parts: Object.fromEntries(platforms.flatMap(name => [
    [name, {name: name + ' accuracy', unit: '%' as const}],
    [name + 'F1', {name: name + ' F1', unit: '%' as const}],
  ])),
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t =>
      t[0].join('|') === 'Model|Mobile|Mobile|Desktop|Desktop|Web|Web|Overall|Overall' &&
      t[1]?.join('|') === 'Model|Accuracy|F1-Score|Accuracy|F1-Score|Accuracy|F1-Score|Accuracy|F1-Score');
    if (!table) throw new Error('Missing Table 1 accuracy and F1 columns');
    return checked(table.slice(2).filter(row => new Set(row).size > 1).map(([model, ...cells]) => {
      if (cells.length !== 8) throw new Error('Incomplete Table 1 row');
      const [mobile, mobileF1, desktop, desktopF1, web, webF1, score, f1] = cells.map(numberCell);
      return { model, score, metrics: {Mobile: mobile, MobileF1: mobileF1, Desktop: desktop, DesktopF1: desktopF1, Web: web, WebF1: webF1, f1} };
    }), 13);
  },
};
export default board;
