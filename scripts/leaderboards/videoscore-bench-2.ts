// VideoScore-Bench v2 tests how closely video evaluators match human ratings on three dimensions.
// Table 5 reports average exact accuracy, relaxed accuracy and correlation with human scores.
import type { Leaderboard } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2509.22799';
const keys = ['visual', 'align', 'phy', 'avg', 'relaxedVisual', 'relaxedAlign', 'relaxedPhy', 'relaxedAvg',
  'plccVisual', 'plccAlign', 'plccPhy', 'plccAvg'];
const board: Leaderboard = {
  benchmark: 'videoscore-bench-2', url: feed, feed, static: 'paper',
  terms: 'arXiv terms apply to the authors’ paper. https://info.arxiv.org/help/license/index.html',
  parts: { visual: 'Visual Quality', align: 'Text Alignment', phy: 'Physical/Common-sense Consistency' },
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t => t[0][0] === 'VideoScore-Bench-v2' &&
      keys.every((_, i) => t[0][i + 1] === ['Accuracy', 'Relaxed Accuracy', 'PLCC'][Math.floor(i / 4)] &&
        t[1][i + 1] === ['Visual', 'Align', 'Phy', 'Avg'][i % 4]));
    if (!table) throw new Error('Missing VideoScore-Bench v2 main table');
    let group = '';
    const rows = [];
    for (const [model, ...cells] of table.slice(2)) {
      if (cells.every(c => c === model)) { group = model; continue; }
      if (model.includes('over Best Baseline')) continue;
      if (cells.length !== keys.length || cells.some(c => c !== '-' && !/^-?\d+(\.\d+)?$/.test(c))) throw new Error('Invalid row for ' + model);
      const metrics = Object.fromEntries(cells.flatMap((c, i) => c === '-' ? [] : [[keys[i], Number(c)]]));
      rows.push({ model: model === 'Ours' ? group : model, score: metrics.avg, metrics });
    }
    return checked(rows, 16);
  },
};
export default board;
