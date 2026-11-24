// Models predict whether a smaller vision model correctly classifies the clip.
// The Baselines section of the author's package README reports accuracy on 45 clips.
import { execFileSync } from 'node:child_process';
import type { Leaderboard } from './types.ts';
import { fetchBytes, fetchJson } from '../lib/util.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://api.primeintellect.ai/api/v1/environmentshub/referee-lab/escalation-router/@latest';
const board: Leaderboard = {
  benchmark: 'escalation-router', feed, url: 'https://app.primeintellect.ai/dashboard/environments/referee-lab/escalation-router',
  terms: 'Prime Intellect hosts the results under its platform terms. https://www.primeintellect.ai/terms-of-service',
  aliases: { 'gemma3:27b': 'gemma-3-27b', 'qwen2.5vl:7b': 'qwen2-5-vl-7b' },
  stats: { scored: { name: 'Scored clips', unit: 'count' }, errors: { name: 'Errors', unit: 'count', better: 'lower' } },
  async fetch() {
    const { data } = await fetchJson<{ data: { package_url: string } }>(feed);
    const archive = Buffer.from(await fetchBytes(data.package_url));
    const readme = execFileSync('tar', ['-xzOf', '-', 'README.md'], { input: archive, encoding: 'utf8' });
    const section = readme.split('### Baselines')[1]?.split('### ')[0];
    if (!section) throw new Error('Missing Escalation Router baselines');
    const [header, ...values] = markdownTables(section).flat();
    if (header?.join('|') !== 'Model|Accuracy|Scored|Errors') throw new Error('Escalation Router columns changed');
    return checked(values.map(([model, accuracy, scored, errors]) => {
      if (!/^\d+(?:\.\d+)?%$/.test(accuracy) || !/^\d+$/.test(scored) || !/^\d+$/.test(errors)) throw new Error('Invalid baseline');
      return { model, setting: 'Temperature 0', trials: 1,
        score: parseFloat(accuracy), metrics: { scored: Number(scored), errors: Number(errors) } };
    }), 2);
  },
};
export default board;
