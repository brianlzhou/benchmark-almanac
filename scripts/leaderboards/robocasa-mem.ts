// RoboCasa-Mem tests environment and process memory for long-horizon mobile manipulation.
// Table 3 reports macro-average success rate and stage completion rate across nine tasks.
import type { Leaderboard } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2611.06475';
const board: Leaderboard = {
  benchmark: 'robocasa-mem', static: 'paper', url: feed, feed,
  terms: 'The authors publish the results in the arXiv paper. https://arxiv.org/abs/2611.06475',
  parts: { successRate: 'Success rate', stageCompletionRate: 'Stage completion rate' },
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t => t[1]?.[0] === 'Model' && t[1]?.[9] === 'Avg.');
    if (!table) throw new Error('RoboCasa-Mem results table missing');
    const rows = table.slice(3).filter(row => row[0] && /^\d/.test(row[9]) && /^\d/.test(row[10])).map(row => {
      const metrics = { successRate: Number(row[9]) * 100, stageCompletionRate: Number(row[10]) * 100 };
      return { model: row[0], score: metrics.successRate, metrics };
    });
    return checked(rows, 5);
  },
};
export default board;
