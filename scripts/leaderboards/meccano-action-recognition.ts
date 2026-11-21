// MECCANO tests action recognition during assembly. Table 3 gives top-1 accuracy on the original test set.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = "https://arxiv.org/html/2010.05654";
const board: Leaderboard = {
  benchmark: "meccano-action-recognition", static: 'paper', url: feed, feed,
  terms: 'The authors publish the paper under the license listed at https://arxiv.org/abs/2010.05654.',
  stats: { top5: {name:'Top-5 accuracy',unit:'%',better:'higher'}, avgClassPrecision: {name:'Average class precision',unit:'%',better:'higher'}, avgClassRecall: {name:'Average class recall',unit:'%',better:'higher'}, avgClassF1: {name:'Average class F1',unit:'%',better:'higher'} },
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const t = tables.find(t => t[0]?.join('|') === '|Top-1 Accuracy|Top-5 Accuracy|Avg Class Precision|Avg Class Recall|Avg Class F_1-score');
    if (!t) throw new Error('Missing action recognition Table 3');
    const rows = t.slice(1).map(([model, ...cells]) => {
      if (cells.length !== 5) throw new Error('Missing MECCANO score');
      const [score, top5, avgClassPrecision, avgClassRecall, avgClassF1] = cells.map(numberCell);
      return { model, score, metrics: { top5, avgClassPrecision, avgClassRecall, avgClassF1 } };
    });
    return checked(rows, 3);
  },
};
export default board;
