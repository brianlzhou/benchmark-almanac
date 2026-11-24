// ESD tests object segmentation in event-camera recordings of cluttered tabletops.
// Table 2 reports test accuracy and mean intersection over union for event-based transfer learning.
import type { Leaderboard } from './types.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2302.06301';
const board: Leaderboard = {
  benchmark: 'event-based-segmentation-dataset',
  static: 'paper',
  url: feed + '#Sx4.T2',
  feed,
  terms: 'The authors publish their results on arXiv under the terms listed at https://arxiv.org/abs/2302.06301.',
  stats: { mIoU: { name: 'Mean intersection over union', unit: '%', better: 'higher' } },
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t => t[0][0] === 'Terms' && t[2]?.[0] === 'ESD');
    if (!table || table[1].join('|') !== '|Acc|mIoU|Acc|mIoU') throw new Error('Missing ESD accuracy or mIoU columns');
    return checked([1, 3].map(i => ({
      model: table[0][i],
      setting: 'Event-based transfer learning',
      score: numberCell(table[2][i]),
      metrics: { mIoU: numberCell(table[2][i + 1]) },
    })), 2);
  },
};
export default board;
