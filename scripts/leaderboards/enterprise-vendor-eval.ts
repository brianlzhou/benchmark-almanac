// Agents audit vendor documents. The Model results table reports the weighted reward across all 20 scenarios.
import { execFileSync } from 'node:child_process';
import type { Leaderboard } from './types.ts';
import { fetchBytes, fetchJson } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { markdownTables } from '../lib/boards/github-markdown.ts';

const slug = 'musa8026/enterprise-vendor-eval';
const feed = 'https://api.primeintellect.ai/api/v1/environmentshub/' + slug + '/@latest';
const board: Leaderboard = {
  benchmark: 'enterprise-vendor-eval', feed,
  url: 'https://app.primeintellect.ai/dashboard/environments/' + slug,
  terms: 'Prime Intellect hosts the author’s results under its platform terms. https://www.primeintellect.ai/terms-of-service',
  aliases: { 'Mistral Small 2603': 'mistral-small-4', 'Llama 3.3 70B': 'llama-3-3-70b-instruct' },
  stats: { gaps: { name: 'Gap reward', unit: 'score' }, decision: { name: 'Decision reward', unit: 'score' },
    process: { name: 'Process reward', unit: 'score' }, falseFlags: { name: 'False flags per rollout', unit: 'count', better: 'lower' } },
  async fetch() {
    const { data } = await fetchJson<{ data: { package_url: string } }>(feed);
    const archive = Buffer.from(await fetchBytes(data.package_url));
    const readme = execFileSync('tar', ['-xzOf', '-', 'README.md'], { input: archive, encoding: 'utf8' });
    const section = readme.split('### Model results')[1];
    const table = markdownTables(section ?? '')[0];
    if (table?.[0].join('|') !== 'Model|Reward|reward_gaps|reward_decision|reward_process|False flags/rollout' ||
        !section.includes('DeepSeek and Llama at 3 rollouts/example (n=60), Mistral at 2 (n=40)'))
      throw new Error('Missing vendor evaluation results or run settings');
    return checked(table.slice(1).map(([model, ...cells]) => {
      if (cells.length !== 5 || !cells.every(c => /^\d+\.\d+$/.test(c))) throw new Error('Invalid vendor result');
      const [score, gaps, decision, process, falseFlags] = cells.map(Number);
      return { model, score, trials: model.startsWith('Mistral') ? 2 : 3,
        setting: 'Temperature 0.3, 20 scenarios', metrics: { gaps, decision, process, falseFlags } };
    }), 3);
  },
};
export default board;
