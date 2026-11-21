// MobileAgentBench tests whether mobile agents complete tasks in Android apps.
// Table 2 reports task success as a fraction. Convert it to percent and retain the other five measures.
import type { Leaderboard } from './types.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2406.08184';
const backbones: Record<string, string> = {
  AndroidArena: 'GPT-4V', AutoDroid: 'GPT-3.5', AppAgent: 'GPT-4V', CogAgent: 'CogAgent', MobileAgent: 'GPT-4V',
};
const board: Leaderboard = {
  benchmark: 'mobileagentbench', static: 'paper', url: 'https://mobileagentbench.github.io/', feed,
  terms: 'The authors publish Table 2 under the paper terms linked at https://arxiv.org/abs/2406.08184.',
  harnesses: 'system', aliases: { CogAgent: 'cogagent-18b' },
  stats: {
    stepEfficiency: { name: 'Minimum action steps', unit: 'count', better: 'lower', note: 'Minimum number of steps on successful tasks, excluding failures.' },
    latency: { name: 'Latency', unit: 'seconds', better: 'lower', note: 'Average time spent before and after one action.' },
    tokens: { name: 'Tokens', unit: 'tokens', note: 'LLM input and output tokens estimated with the GPT-4V token standard.' },
    falseNegativeRate: { name: 'False negative rate', unit: 'score', better: 'lower', note: 'Fraction of failed tasks that the agent ends early and incorrectly marks as failed.' },
    falsePositiveRate: { name: 'False positive rate', unit: 'score', better: 'lower', note: 'Fraction of successful tasks that the agent incorrectly marks as successful.' },
  },
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t => t[0]?.[0] === 'Agent');
    const columns = ['Agent', 'SR', 'SE', 'Latency (s)', 'Tokens', 'FN Rate', 'FP Rate'];
    if (!table || table[0].map(c => c.split(' \\')[0]).join('|') !== columns.join('|')) {
      throw new Error('Missing agent performance columns');
    }
    const rows = table.slice(1).map(([name, ...cells]) => {
      const harness = name.replace(/\s*\[[^\]]+\]/g, '').trim();
      if (!backbones[harness] || cells.length !== 6) throw new Error('Unexpected agent row: ' + name);
      const [sr, stepEfficiency, latency, tokens, fn, fp] = cells.map(numberCell);
      const setting = harness === 'AutoDroid' ? 'Android 9' : harness === 'CogAgent' ? 'Android 14, 4-bit' :
        harness === 'AppAgent' ? 'Android 14, self-exploration' : 'Android 14';
      return { model: backbones[harness], harness, setting, score: Math.round(sr * 100),
        metrics: { stepEfficiency, latency, tokens, falseNegativeRate: fn, falsePositiveRate: fp } };
    });
    return checked(rows, 5);
  },
};
export default board;
