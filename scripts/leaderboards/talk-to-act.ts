// Talk to Act tests whether a model identifies the goal and actions in a conversation with a robot.
// Table I gives goal achievement accuracy, the share of examples where the predicted action set matches the reference.
import type { Leaderboard } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2611.17549';
const board: Leaderboard = {
  benchmark: 'talk-to-act', static: 'paper', url: feed, feed,
  terms: 'The authors publish Table I under the license on the arXiv record. https://arxiv.org/abs/2611.17549',
  aliases: {'Gemma4:E2B': 'gemma-4-e2b-it', 'Gemma4:E4B': 'gemma-4-e4b-it'},
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t => t[0]?.join('|') === 'Model|Goal|Action Level|Action Level|Action Level|Action Level');
    if (!table || table[1].join('|') !== 'Model|Acc. (%)|Prec. (%)|Rec. (%)|F1 (%)|Acc. (%)') throw new Error('Talk to Act Table I columns changed');
    const rows = table.slice(2).map(([model, goal, precision, recall, f1, accuracy]) => ({
      model, score: numberCell(goal), metrics: {actionPrecision: numberCell(precision), actionRecall: numberCell(recall), actionF1: numberCell(f1), actionAccuracy: numberCell(accuracy)},
    }));
    return checked(rows, 5);
  },
};
export default board;
