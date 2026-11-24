// Agents clean hourly sensor readings. The README reports weighted reward on ten tasks for each sensor-window setting.
import { execFileSync } from 'node:child_process';
import type { Leaderboard } from './types.ts';
import { fetchBytes, fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const slug = 'afzal0/sci-pipeline-v1';
const feed = 'https://api.primeintellect.ai/api/v1/environmentshub/' + slug + '/@latest';
const board: Leaderboard = {
  benchmark: 'sci-pipeline-v1', feed,
  url: 'https://app.primeintellect.ai/dashboard/environments/' + slug,
  terms: 'Prime Intellect hosts the author’s results under its platform terms. https://www.primeintellect.ai/terms-of-service',
  stats: { dailyMeans: { name: 'Daily means reward', unit: 'score' }, extremes: { name: 'Extremes reward', unit: 'score' },
    recordCounts: { name: 'Record counts reward', unit: 'score' }, producedOutput: { name: 'Produced output', unit: 'score' },
    tasks: { name: 'Completed tasks', unit: 'count' } },
  async fetch() {
    const { data } = await fetchJson<{ data: { package_url: string } }>(feed);
    const archive = Buffer.from(await fetchBytes(data.package_url));
    const readme = execFileSync('tar', ['-xzOf', '-', 'README.md'], { input: archive, encoding: 'utf8' });
    const table = markdownTables(readme).find(t => t[0].join('|') === 'Model|num_days|Reward|daily_means|extremes|record_counts|produced_output');
    const run = readme.match(/Measured end-to-end on ([\d-]+) via Prime Inference \(temperature ([\d.]+), .bash. harness,\s*Docker runtime, (\d+) tasks each/);
    if (!table || !run) throw new Error('Missing Sci Pipeline comparison or settings');
    return checked(table.slice(1).map(([model, days, ...cells]) => {
      if (!/^\d+$/.test(days) || cells.length !== 5 || !cells.every(c => /^\d+\.\d+$/.test(c))) throw new Error('Invalid pipeline result');
      const [score, dailyMeans, extremes, recordCounts, producedOutput] = cells.map(Number);
      return { model, date: run[1], harness: 'bash', setting: days + ' days, temperature ' + run[2], score,
        metrics: { dailyMeans, extremes, recordCounts, producedOutput, tasks: Number(run[3]) } };
    }), 3);
  },
};
export default board;
