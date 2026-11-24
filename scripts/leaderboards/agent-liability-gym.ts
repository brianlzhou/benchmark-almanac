// Agents review legal case files. The v0.4.0 hybrid baseline table reports mean reward
// across five cases with one rollout each, using the other model as judge.
import { execFileSync } from 'node:child_process';
import type { Leaderboard } from './types.ts';
import { fetchBytes } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://hub.primeintellect.ai/narcolepticchicken/agent-liability-gym/@6e5d4af8/download';
const board: Leaderboard = {
  benchmark: 'agent-liability-gym',
  url: 'https://app.primeintellect.ai/dashboard/environments/narcolepticchicken/agent-liability-gym',
  feed,
  terms: 'The author publishes the package under the Prime Intellect platform terms at https://www.primeintellect.ai/terms-of-service.',
  stats: {
    delivery: { name: 'Delivery', unit: 'score', better: 'higher' },
    findingRecall: { name: 'Finding recall', unit: 'score', better: 'higher' },
    judge: { name: 'Judge score', unit: 'score', better: 'higher' },
    falseFlags: { name: 'False flags', unit: 'score', better: 'lower' },
    cases: { name: 'Cases', unit: 'count' },
  },
  async fetch() {
    const readme = execFileSync('tar', ['-xzOf', '-', 'README.md'], { input: Buffer.from(await fetchBytes(feed)), encoding: 'utf8' });
    const table = readme.split('### v0.4.0 hybrid')[1]?.match(/\| Agent \| Judge \| n×r \| deliv \| FR \(Fix\) \| judge \| FF \| reward \|\n[^\n]+\n((?:\|[^\n]+\n)+)/);
    if (!table) throw new Error('Missing hybrid baseline table');
    const rows = table[1].trim().split('\n').map(line => {
      const [model, judge, runs, ...cells] = line.split('|').slice(1, -1).map(c => c.trim().replace(/\*/g, ''));
      if (!/^\d+×\d+$/.test(runs) || cells.length !== 5 || !cells.every(v => /^\d+(?:\.\d+)?$/.test(v))) throw new Error('Invalid hybrid baseline');
      const [cases, trials] = runs.split('×').map(Number);
      const [delivery, findingRecall, judgeScore, falseFlags, score] = cells.map(Number);
      return { model, score, trials, setting: 'v0.4.0 hybrid, judge ' + judge, metrics: { cases, delivery, findingRecall, judge: judgeScore, falseFlags } };
    });
    return checked(rows, 2);
  },
};
export default board;
