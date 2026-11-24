// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// The package README scores reviews of full diffs and single-defect excerpts by F1.
import { execFileSync } from 'node:child_process';
import type { Leaderboard, BoardStat } from './types.ts';
import { fetchBytes } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://hub.primeintellect.ai/korck/arch-review-v1/@4565997f/download';
const parts = { curated: 'Curated tasks', excerpts: 'Sub-tasks' };
const columns = ['Recall', 'Precision', 'Claims', 'False alarms', 'Distractor hits'];
const stats: Record<string, BoardStat> = {};
for (const [part, label] of Object.entries(parts)) {
  for (const [i, column] of columns.entries()) {
    stats[part + i] = { name: label + ': ' + column, unit: i < 2 ? 'score' : 'count' };
  }
}
const board: Leaderboard = {
  benchmark: 'arch-review-v1', feed,
  url: 'https://app.primeintellect.ai/dashboard/environments/korck/arch-review-v1',
  terms: 'Prime Intellect hosts the author’s public package under its platform terms at https://www.primeintellect.ai/terms-of-service.',
  headline: 'The headline averages the two F1 scores equally. The authors report separate rankings because the excerpts change the difficulty of precision.',
  parts, stats,
  async fetch() {
    const readme = execFileSync('tar', ['-xzOf', '-', 'README.md'], { input: Buffer.from(await fetchBytes(feed)), encoding: 'utf8' });
    const models = new Map<string, Record<string, number>>();
    for (const [part, label] of Object.entries(parts)) {
      const section = readme.split('### ' + label + ' (')[1]?.split('\n##')[0];
      const table = section?.match(/\| Model \| F1 \| Recall \| Precision \| Claims \| False alarms \| Distractor hits \|\n[^\n]+\n((?:\|[^\n]+\n)+)/);
      if (!table) throw new Error('Missing results for ' + label);
      for (const line of table[1].trim().split('\n')) {
        const [model, ...cells] = line.split('|').slice(1, -1).map(c => c.trim().replace(/\*/g, ''));
        if (cells.length !== 6 || !cells.every(v => /^\d+(\.\d+)?$/.test(v))) throw new Error('Invalid results for ' + model);
        const metrics = models.get(model) ?? {};
        if (part in metrics) throw new Error('Duplicate model in ' + label);
        metrics[part] = Number(cells[0]);
        columns.forEach((_, i) => { metrics[part + i] = Number(cells[i + 1]); });
        models.set(model, metrics);
      }
    }
    return checked([...models].filter(([, m]) => 'curated' in m && 'excerpts' in m).map(([model, metrics]) =>
      ({ model, metrics, score: (metrics.curated + metrics.excerpts) / 2, trials: 3 })), 3);
  },
};
export default board;
