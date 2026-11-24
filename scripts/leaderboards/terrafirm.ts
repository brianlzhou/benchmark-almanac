// Models choose asset sales that meet five portfolio constraints. A run passes if any proposed scenario qualifies.
// The package README gives pass rates and sales of two trap properties over ten attempts.
import type { Leaderboard } from './types.ts';
import { execFileSync } from 'node:child_process';
import { fetchBytes, fetchJson } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
const url = 'https://app.primeintellect.ai/dashboard/environments/iceberg/terrafirm';
const feed = 'https://api.primeintellect.ai/api/v1/environmentshub/iceberg/terrafirm/@latest';
const board: Leaderboard = {
  benchmark: 'terrafirm', url, feed, terms: 'Prime Intellect hosts the results under https://www.primeintellect.ai/terms-of-service.',
  stats: { soldCenterSquare: { name: 'CenterSquare sales', unit: 'count', better: 'lower' },
    soldPrince: { name: 'Prince sales', unit: 'count', better: 'lower' } },
  async fetch() {
    const { data } = await fetchJson<{data: {package_url: string}}>(feed);
    const readme = execFileSync('tar', ['-xzOf', '-', 'README.md'], {
      input: Buffer.from(await fetchBytes(data.package_url)), encoding: 'utf8',
    });
    const section = readme.split('## Benchmark Results (10 iterations each)')[1];
    const table = markdownTables(section || '').find(t => t[0].join('|') === 'Model|Pass Rate (≥1 scenario)|Sold CenterSquare/Prince');
    if (!table) throw new Error('Missing ten-attempt benchmark results');
    return checked(table.slice(1).map(([model, rate, sales]) => {
      const counts = sales.match(/^(\d+)x \/ (\d+)x$/);
      if (!counts || !/^\d+%$/.test(rate)) throw new Error('Invalid property sales result');
      return { model, score: parseFloat(rate), trials: 10, metrics: { soldCenterSquare: Number(counts[1]), soldPrince: Number(counts[2]) } };
    }), 7);
  },
};
export default board;
