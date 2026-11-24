// Models answer board-style medical physics questions. The README reports test accuracy and 95% intervals.
// These historical baseline runs used the 90-question test split.
import type { Leaderboard } from './types.ts';
import { execFileSync } from 'node:child_process';
import { fetchBytes, fetchJson } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const url = 'https://app.primeintellect.ai/dashboard/environments/omar/medphysbench-kq';
const feed = 'https://api.primeintellect.ai/api/v1/environmentshub/omar/medphysbench-kq/@latest';
const board: Leaderboard = {
  benchmark: 'medphysbench-kq', url, feed, terms: 'Prime Intellect hosts the results under https://www.primeintellect.ai/terms-of-service.',
  async fetch() {
    const { data } = await fetchJson<{data: {package_url: string}}>(feed);
    const readme = execFileSync('tar', ['-xzOf', '-', 'README.md'], {
      input: Buffer.from(await fetchBytes(data.package_url)), encoding: 'utf8',
    });
    const section = readme.split('Baseline Results (Test Split, n=90)')[1];
    const table = markdownTables(section || '').find(t => t[0].join('|') === 'Model|Accuracy|95% CI');
    if (!table) throw new Error('Missing 90-question results table');
    return checked(table.slice(1).map(([label, accuracy, interval]) => {
      const bounds = interval.match(/^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/);
      if (!bounds && interval !== '—') throw new Error('Invalid confidence interval');
      const cot = label.endsWith(' (CoT)');
      return { model: label.replace(/ \(CoT\)$/, ''), score: parseFloat(accuracy),
        setting: cot ? '90-question test split, chain of thought' : '90-question test split',
        low: bounds ? Number(bounds[1]) : undefined, high: bounds ? Number(bounds[2]) : undefined };
    }), 6);
  },
};
export default board;
