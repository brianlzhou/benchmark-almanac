// PWNBench scores model reports against expert labels for web application vulnerabilities.
// Novee supplies Fireworks with all-severity F0.5, which weights precision more heavily than recall.
import { fireworksBoard } from '../lib/boards/fireworks.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import type { Leaderboard } from './types.ts';

const source = fireworksBoard('pwnbench-v0-1', 'offensive/pwnbench-v0-1');
source.stats = { cost_per_task: { name: 'Cost per task', unit: 'usd', better: 'lower' }, k: { name: 'Attempt count', unit: 'count' }, precision: { name: 'Precision', unit: '%', better: 'higher' }, recall: { name: 'Recall', unit: '%', better: 'higher' }, mediumPrecision: { name: 'Medium-severity precision', unit: '%', better: 'higher' }, mediumRecall: { name: 'Medium-severity recall', unit: '%', better: 'higher' } };
export default {
  ...source, host: 'Fireworks AI',
  terms: 'Fireworks publishes the Novee results under https://fireworks.ai/terms-of-service',
  aliases: { 'DS-V4-Flash-0731': 'deepseek-v4-flash-0731', 'Opus 5': 'claude-opus-5',
    'Opus 4.8': 'claude-opus-4-8', 'Opus 4.6': 'claude-opus-4-6' },
  parts: { mediumF05: 'F0.5 (medium and above)' },
  async fetch() {
    const rows = await source.fetch();
    for (const row of rows) {
      const attempts = row.metrics?.k;
      if (!attempts || row.metrics?.mediumF05 === undefined) throw new Error('Missing attempt budget or medium severity score');
      row.setting = [row.setting, 'k=' + attempts].filter(Boolean).join(', ');
      row.trials = attempts;
    }
    return checked(rows, 15);
  },
} satisfies Leaderboard;
