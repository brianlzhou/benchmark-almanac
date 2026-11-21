// LV-VIS tests segmentation and tracking of objects across video frames.
// Table 2 reports average precision across all categories on the test split.
import type { Leaderboard } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2304.01715';
const board: Leaderboard = {
  benchmark: 'large-vocabulary-video-instance-segmentation',
  url: feed + '#S6.T2', feed, static: 'paper',
  terms: 'The authors publish Table 2 on arXiv under the terms at https://arxiv.org/abs/2304.01715.',
  parts: { base: 'Test AP (base categories)', novel: 'Test AP (novel categories)',
    val: 'Validation AP', valBase: 'Validation AP (base categories)', valNovel: 'Validation AP (novel categories)' },
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(rows =>
      rows[0]?.join('|') === 'Method|Backbone|Val|Val|Val|Test|Test|Test|fps');
    if (table?.[1]?.join('|') !== 'Method|Backbone|AP|AP b|AP n|AP|AP b|AP n|fps') {
      throw new Error('Missing LV-VIS test and validation AP columns');
    }
    return checked(table.slice(2).map(([name, setting, ...cells]) => {
      if (cells.length !== 7) throw new Error('Unexpected LV-VIS result width');
      const [val, valBase, valNovel, score, base, novel, fps] = cells.map(numberCell);
      const model = name.replace(/\s*\[\s*\d+\s*\]\s*/g, '').replace('(Ours)', '');
      return { model, setting, score, metrics: { val, valBase, valNovel, base, novel, fps } };
    }), 10);
  },
};
export default board;
