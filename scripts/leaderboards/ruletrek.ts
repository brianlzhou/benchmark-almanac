// RuleTrek tests whether agents can find and apply rules across multiple files.
// Table 2 ranks models by their end-to-end score across all 240 instances.
import type { Leaderboard } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2610.19698';
const domains = ['Avg.', 'Tax', 'Game', 'Procurement', 'Cybersecurity', 'Software Policy', 'PostgreSQL'];
const tasks = {RI: 'Rule Identification', RD: 'Rule Deduction', E2E: 'End-to-End Decision'};
const columns = domains.flatMap(domain => Object.entries(tasks).map(([task, name]) => ({
  domain, task, key: domain === 'Avg.' ? task : domain + ' ' + task, name,
})));
const board: Leaderboard = {
  benchmark: 'ruletrek', url: feed, feed, static: 'paper', reference: ['pi CLI'],
  terms: 'The authors publish their results under the license linked at https://arxiv.org/abs/2610.19698.',
  headline: 'The headline is the end-to-end score across all 240 instances, averaged over three runs.',
  parts: Object.fromEntries(columns.filter(c => c.key !== 'E2E').map(c => [c.key, {name: c.name, group: c.domain === 'Avg.' ? 'All domains' : c.domain}])),
  async fetch() {
    const header = ['Model', ...columns.map(c => c.domain)].join('|');
    const tasksHeader = ['Model', ...columns.map(c => c.task)].join('|');
    const table = paperTables(await paperHtml(feed)).map(grid).find(t => t[0].join('|') === header && t[1]?.join('|') === tasksHeader);
    if (!table) throw new Error('Missing RuleTrek main results columns');
    return checked(table.slice(2).map(row => {
      const metrics = Object.fromEntries(columns.map((c, i) => [c.key, numberCell(row[i + 1])]));
      const {E2E: score, ...others} = metrics;
      return {model: row[0], score, trials: 3, harness: 'pi CLI', metrics: others};
    }), 11);
  },
};
export default board;
