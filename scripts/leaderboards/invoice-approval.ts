// Agents process invoices under a German approval policy. The Step 3 report compares
// both models on all 50 original work orders. It adds a hard tier for one model later.
import { execFileSync } from 'node:child_process';
import { fetchBytes } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import type { Leaderboard } from './types.ts';

const feed = 'https://hub.primeintellect.ai/ali-siala/invoice-approval/@24263bee/download';
const board: Leaderboard = {
  benchmark: 'invoice-approval', feed,
  url: 'https://app.primeintellect.ai/dashboard/environments/ali-siala/invoice-approval',
  terms: 'The author releases this environment under Apache-2.0. https://www.apache.org/licenses/LICENSE-2.0',
  headline: 'Pass rate on the 50 original tasks. Only GPT-5.6-sol ran the 10 hard tasks added later.',
  parts: { single: 'Single', batch: 'Batch', long: 'Long-horizon', hard: 'Hard' },
  stats: { passes: { name: 'Successful attempts', unit: 'count' }, attempts: { name: 'Attempts', unit: 'count' } },
  async fetch() {
    const report = execFileSync('tar', ['-xzOf', '-', 'results/step3_summary.md'], { input: Buffer.from(await fetchBytes(feed)), encoding: 'utf8' });
    const table = markdownTables(report).find(t => t[0][0] === 'Tier' && t.some(row => row[0] === 'all 50'));
    if (!table) throw new Error('Missing Step 3 comparison');
    return checked(table[0].slice(1).map((header, i) => {
      const id = header.match(/^(.+) \(-r (\d+)\)$/);
      if (!id) throw new Error('Missing model or rollout count');
      const metrics: Record<string, number> = {};
      const labels = { single: 'single (20 tasks)', batch: 'batch (20 tasks)', long: 'long-horizon (10 tasks)', hard: 'hard (10 tasks, added later)', overall: 'all 50' };
      let score = NaN;
      for (const [key, label] of Object.entries(labels)) {
        const cell = table.find(row => row[0] === label)?.[i + 1];
        if (key === 'hard' && cell === 'not run') continue;
        const counts = cell?.match(/^(\d+)\/(\d+) \(\d+%\)$/);
        if (!counts || +counts[2] === 0) throw new Error('Missing pass counts for ' + label);
        const rate = 100 * +counts[1] / +counts[2];
        if (key === 'overall') { score = rate; metrics.passes = +counts[1]; metrics.attempts = +counts[2]; }
        else metrics[key] = rate;
      }
      return { model: id[1], trials: +id[2], setting: 'Original 50 tasks', metrics, score };
    }), 2);
  },
};
export default board;
