// Click Calibrate tests whether models can click a target in a screenshot.
// The v0.1.0 results in Prime's package README report mean hit reward and a breakdown by image size.
import { execFileSync } from 'node:child_process';
import type { Leaderboard } from './types.ts';
import { fetchJson, fetchBytes } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://api.primeintellect.ai/api/v1/environmentshub/prime/click-calibrate/@latest';
const sizes = ['1024x768', '1440x900', '1280x720', '1000x1000', '800x600'];
const statKeys = ['distance', 'extracted', 'tool', 'truncation', 'error'];
function number(cell: string) {
  if (!/^\d+(?:\.\d+)?$/.test(cell)) throw new Error('Invalid click calibration result');
  return Number(cell);
}
const board: Leaderboard = {
  benchmark: 'click-calibrate-prime', feed,
  url: 'https://app.primeintellect.ai/dashboard/environments/prime/click-calibrate',
  terms: 'Prime Intellect publishes its package under its platform terms. https://www.primeintellect.ai/terms-of-service',
  parts: Object.fromEntries(sizes.map(size => [size, { name: size, group: 'Image size' }])),
  stats: {
    distance: { name: 'Distance in pixels', unit: 'score', better: 'lower' },
    extracted: { name: 'Click extracted', unit: 'score', better: 'higher' },
    tool: { name: 'Tool call used', unit: 'score' },
    truncation: { name: 'Truncation rate', unit: 'score', better: 'lower' },
    error: { name: 'Error rate', unit: 'score', better: 'lower' },
  },
  async fetch() {
    const { data } = await fetchJson<{ data: { package_url: string } }>(feed);
    const archive = Buffer.from(await fetchBytes(data.package_url));
    const readme = execFileSync('tar', ['-xzOf', '-', 'README.md'], { input: archive, encoding: 'utf8' });
    const section = readme.split('### v0.1.0 Results')[1]?.split(/\n#{1,3} /)[0];
    if (!section) throw new Error('Missing v0.1.0 results');
    const tables = markdownTables(section);
    const results = tables.find(t => t[0].join('|') === 'Model|Mode|Reward|Distance px|Click extracted|Tool call used|Truncation|Error');
    const parts = tables.find(t => t[0].join('|') === ['Model', 'Mode', ...sizes].join('|'));
    if (!results || !parts) throw new Error('Click Calibrate results columns changed');
    return checked(results.slice(1).map(([model, setting, reward, ...stats]) => {
      const matches = parts.slice(1).filter(r => r[0] === model && r[1] === setting);
      if (matches.length !== 1 || matches[0].length !== sizes.length + 2 || stats.length !== statKeys.length) {
        throw new Error('Incomplete Click Calibrate results');
      }
      const metrics = Object.fromEntries(statKeys.map((key, i) => [key, number(stats[i])]));
      sizes.forEach((key, i) => { metrics[key] = number(matches[0][i+2]); });
      return { model, setting, score: number(reward), trials: 5, metrics };
    }), 10);
  },
};
export default board;
