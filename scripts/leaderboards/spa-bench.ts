// SPA-Bench evaluates smartphone agents on single-app and cross-app tasks.
// Table 2 reports separate success rates for the two task families, so the headline is their plain mean.
import type { Leaderboard } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2410.15164';
const board: Leaderboard = {
  benchmark: 'spa-bench', static: 'paper', url: feed, feed,
  harnesses: 'system',
  terms: 'The authors publish the results in the arXiv paper. https://arxiv.org/abs/2410.15164',
  headline: 'The paper reports no combined score, so this is the plain mean of single-app and cross-app overall success rates.',
  parts: { singleApp: 'Single-App Overall', crossApp: 'Cross-App Overall' },
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t => t[0]?.[0] === 'Agent' && t[1]?.[1] === 'Overall' && t[1]?.[4] === 'Overall');
    if (!table) throw new Error('SPA-Bench results table missing');
    const workflow = table[2]?.[0].match(/^Agentic Workflow \((.+)\)$/);
    const standalone = table.findIndex(row => row[0] === 'Agent-as-a-Model');
    if (!workflow || standalone < 3) throw new Error('SPA-Bench agent groups changed');
    const workflowAgents = new Set(table.slice(3, standalone).map(row => row[0]));
    const rows = table.slice(3).filter(row => row[0] && !['Agent-as-a-Model'].includes(row[0]) && !row[0].startsWith('Agentic Workflow') && /^\d+(?:\.\d+)?$/.test(row[1]) && /^\d+(?:\.\d+)?$/.test(row[4])).map(row => {
      if (row.length !== 7) throw new Error('Invalid SPA-Bench row');
      const metrics = { singleApp: Number(row[1]) * 100, crossApp: Number(row[4]) * 100 };
      const agent = workflowAgents.has(row[0]) ? { model: workflow[1], harness: row[0] } : { model: row[0] };
      return { ...agent, score: (metrics.singleApp + metrics.crossApp) / 2, metrics };
    });
    return checked(rows, 10);
  },
};
export default board;
