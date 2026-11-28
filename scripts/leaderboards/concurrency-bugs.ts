// Agents repair 15 Python concurrency bugs. The package README reports mean pass@1 across all tasks.
// Its Baselines tables also report category, difficulty and task scores, tokens and total cost.
import type { Leaderboard } from './types.ts';
import { execFileSync } from 'node:child_process';
import { fetchBytes, fetchJson } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://app.primeintellect.ai/dashboard/environments/tanishgudise/concurrency-bugs';
const feed = 'https://api.primeintellect.ai/api/v1/environmentshub/tanishgudise/concurrency-bugs/@latest';
const board: Leaderboard = {
  benchmark: 'concurrency-bugs', url, feed, terms: 'The author lists the MIT license at ' + url,
  costPer: 'run',
  async fetch() {
    const { data } = await fetchJson<{data: {package_url: string}}>(feed);
    const readme = execFileSync('tar', ['-xzOf', '-', 'README.md'], {
      input: Buffer.from(await fetchBytes(data.package_url)), encoding: 'utf8',
    });
    const tables = markdownTables(readme.split('## Baselines\n')[1] || '');
    const [summary, tasks, costs] = tables;
    if (summary?.[1]?.[0] !== 'all tasks' || tasks?.[0]?.[0] !== 'task' || costs?.[0]?.join('|') !== 'model|rollouts|hit output limit|format failures|rejected|mean output tokens|cost') throw new Error('Missing baseline tables');
    const parts = [...summary.slice(2), ...tasks.slice(1)].map(r => r[0]);
    board.parts = Object.fromEntries(parts.map(k => [k, k]));
    const rows = summary[0].slice(1).map((model, i) => {
      const cost = costs.find(r => r[0] === model);
      const taskCol = tasks[0].indexOf(model);
      if (!cost || taskCol < 0) throw new Error('Missing model breakdown');
      const metrics: Record<string, number> = {};
      for (const r of summary.slice(2)) metrics[r[0]] = parseFloat(r[i + 1]);
      for (const r of tasks.slice(1)) {
        const [pass, trials] = r[taskCol].split('/').map(Number);
        metrics[r[0]] = 100 * pass / trials;
      }
      return { model, setting: 'Single turn', score: parseFloat(summary[1][i + 1]),
        trials: 3, tokens: Number(cost[5]), cost: Number(cost[6].replace('$', '')), metrics };
    });
    return checked(rows, 3);
  },
};
export default board;
