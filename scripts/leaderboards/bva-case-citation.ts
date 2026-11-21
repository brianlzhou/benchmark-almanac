// The BVA benchmark asks models to recommend the next legal citation in a veterans' appeal decision.
// Table 2 reports recall at ranks one, five and twenty, with standard errors over six test folds.
import type { Leaderboard } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2106.10776';
const board: Leaderboard = {
  benchmark: 'bva-case-citation', static: 'paper', url: feed, feed,
  terms: 'The authors publish the aggregate table on arXiv. https://arxiv.org/abs/2106.10776',
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t => t[0].join('|') === 'Model|Setting|Recall@1|Recall@1|Recall@5|Recall@5|Recall@20|Recall@20');
    if (!table) throw new Error('Missing Table 2 recall columns');
    const rows = table.slice(1).filter(r => r[0] !== 'Majority Vote').map(([model, setting, ...cells]) => {
      const values = cells.map((cell, i) => {
        const m = (i % 2 ? /^\(([\d.]+)%\)$/ : /^([\d.]+)%$/).exec(cell);
        if (!m) throw new Error('Missing recall or standard error for ' + model);
        return Number(m[1]);
      });
      const [score, stderr, recallAt5, recallAt5Stderr, recallAt20, recallAt20Stderr] = values;
      return { model, setting, score, metrics: { stderr, recallAt5, recallAt5Stderr, recallAt20, recallAt20Stderr, testFolds: 6 } };
    });
    return checked(rows, 12);
  },
};
export default board;
