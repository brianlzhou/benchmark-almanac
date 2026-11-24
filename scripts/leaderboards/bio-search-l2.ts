// Agents search and compare PubMed abstracts. The Eval Results table reports pass@1 as a fraction.
import { execFileSync } from 'node:child_process';
import type { Leaderboard } from './types.ts';
import { fetchBytes, fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const slug = 'd42me/bio-search-l2';
const feed = 'https://api.primeintellect.ai/api/v1/environmentshub/' + slug + '/@latest';
const board: Leaderboard = {
  benchmark: 'bio-search-l2', feed,
  url: 'https://app.primeintellect.ai/dashboard/environments/' + slug,
  terms: 'Prime Intellect hosts the author’s results under its platform terms. https://www.primeintellect.ai/terms-of-service',
  stats: { examples: { name: 'Evaluated examples', unit: 'count' } },
  async fetch() {
    const { data } = await fetchJson<{ data: { package_url: string } }>(feed);
    const archive = Buffer.from(await fetchBytes(data.package_url));
    const readme = execFileSync('tar', ['-xzOf', '-', 'README.md'], { input: archive, encoding: 'utf8' });
    const table = markdownTables(readme).find(t => t[0].join('|') === 'Model|pass@1|Notes');
    if (!table) throw new Error('Missing Eval Results table');
    return checked(table.slice(1).map(([label, pass, note]) => {
      const match = label.match(/^(.+) \((.+)\)$/);
      if (!match || !/^0(?:\.\d+)?$|^1(?:\.0+)?$/.test(pass)) throw new Error('Invalid pass@1 row');
      const examples = match[2].match(/n=(\d+)/);
      const rollouts = match[2].match(/r=(\d+)/);
      return { model: match[1], setting: note + ' (' + match[2] + ')', score: Number(pass) * 100,
        trials: rollouts ? Number(rollouts[1]) : undefined, metrics: examples ? { examples: Number(examples[1]) } : undefined };
    }), 3);
  },
};
export default board;
