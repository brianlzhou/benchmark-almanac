// Agents write risk memos for five privacy and incident-reporting matters.
// The author's README compares mean reward, finding recall and deliverables saved over three rollouts per matter.
import { execFileSync } from 'node:child_process';
import { fetchBytes } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import type { Leaderboard } from './types.ts';

const feed = 'https://hub.primeintellect.ai/narcolepticchicken/cybersecurity-privacy-legal-agent-eval/@c3cf8a8e/download';
const board: Leaderboard = {
  benchmark: 'cybersecurity-privacy-legal-agent-eval', feed,
  url: 'https://app.primeintellect.ai/dashboard/environments/narcolepticchicken/cybersecurity-privacy-legal-agent-eval',
  terms: 'Prime Intellect hosts the public package under https://www.primeintellect.ai/terms-of-service.',
  stats: {
    recall: { name: 'Finding recall', unit: 'score', better: 'higher' },
    saved: { name: 'Deliverables saved', unit: 'count', better: 'higher' },
    expected: { name: 'Expected deliverables', unit: 'count' },
  },
  async fetch() {
    const readme = execFileSync('tar', ['-xzOf', '-', 'README.md'], { input: Buffer.from(await fetchBytes(feed)), encoding: 'utf8' });
    const table = readme.match(/\| Model \| Setup \| Reward \| Finding recall \| Deliverables saved \| False flags \|\n[^\n]+\n((?:\|[^\n]+\n)+)/);
    if (!table) throw new Error('Baseline results table missing');
    const rows = table[1].trim().split('\n').map(line => {
      // The first data row has an extra empty cell. Neither row supplies a false flag rate.
      const match = line.match(/^\|\s*(?:\|\s*)?([^|]+?)\s*\| (\d+) tasks × (\d+) rollouts \| ([\d.]+) \| ([\d.]+) \| (\d+)\/(\d+) \|$/);
      if (!match) throw new Error('Invalid baseline row: ' + line);
      const [, model, tasks, runs, reward, recall, saved, expected] = match;
      if (+tasks * +runs !== +expected) throw new Error('Inconsistent rollout count');
      return { model, score: +reward, trials: +runs, metrics: { recall: +recall, saved: +saved, expected: +expected } };
    });
    return checked(rows, 2);
  },
};
export default board;
