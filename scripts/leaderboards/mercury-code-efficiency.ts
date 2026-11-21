// Mercury tests whether generated programs run correctly and efficiently. Table 3 gives the overall Beyond efficiency score.
// The importer converts the paper's 0 to 100 values to the evaluator's 0 to 1 score and retains Table 2 correctness percentages.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2402.07844';
const board: Leaderboard = {
  benchmark: 'mercury-code-efficiency', static: 'paper', url: feed, feed,
  terms: 'The authors publish this table under the terms listed at https://arxiv.org/abs/2402.07844.',
  parts: {easy: 'Easy', medium: 'Medium', hard: 'Hard'},
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const efficiency = tables.find(t => t[0]?.join('|') === 'Model name|Easy|Medium|Hard|Overall|Gap');
    const correctness = tables.find(t => t[1]?.join('|') === 'Model Name|HumanEval|MBPP|Easy|Medium|Hard|Overall');
    if (!efficiency || !correctness || efficiency.length + 1 !== correctness.length) throw new Error('Missing Mercury tables');
    const rows: LeaderboardRow[] = [];
    let model = '';
    for (const [i, [name, easy, medium, hard, overall, gap]] of efficiency.slice(1).entries()) {
      const pass = correctness[i + 2];
      if (name !== pass[0]) throw new Error('Mercury model order changed');
      if (!name.startsWith('+')) model = name;
      const setting = name.startsWith('+') ? name.slice(2) : 'Original';
      rows.push({model, setting, score: numberCell(overall.split(' ')[0]) / 100, metrics: {
        easy: numberCell(easy) / 100, medium: numberCell(medium) / 100, hard: numberCell(hard) / 100,
        gap: numberCell(gap.split(' ')[0]) / 100, pass: numberCell(pass[6].split(' ')[0]),
        passEasy: numberCell(pass[3]), passMedium: numberCell(pass[4]), passHard: numberCell(pass[5]),
      }});
    }
    return checked(rows, 30);
  },
};
export default board;
