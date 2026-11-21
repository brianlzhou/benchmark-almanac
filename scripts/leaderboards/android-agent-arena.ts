// The source reports no overall score. The headline is the plain mean of the 3 parts, computed by this importer.
// Android Agent Arena tests mobile GUI agents. Tables 5 and 6 of version 1 report success by difficulty and task category.
import type { Leaderboard } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2501.01149v1';
const board: Leaderboard = {
  benchmark: 'android-agent-arena', static: 'paper', url: feed, feed,
  terms: 'The authors publish the original A3 results on arXiv, https://arxiv.org/licenses/nonexclusive-distrib/1.0/.',
  aliases: { InternVL2: 'internvl2-8b' },
  headline: 'The paper reports no overall score, so this is the plain mean of success rates at its three difficulty levels.',
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const models = new Map<string, Record<string, number>>();
    board.parts = {};
    for (const [column, group] of [['Test Level', 'Difficulty'], ['Test Category', 'Task category']]) {
      const table = tables.find(t => t[0].join('|') === ['Agent', column, 'Succ. Rate'].join('|'));
      if (!table) throw new Error('Missing ' + column + ' table');
      for (const [model, name, percent] of table.slice(1)) {
        const metrics = models.get(model) ?? {};
        const key = name.replace(/[ -]/g, '');
        if (key in metrics || !/^\d+(?:\.\d+)?%$/.test(percent)) throw new Error('Unexpected A3 score');
        board.parts[key] = { name, group };
        metrics[key] = parseFloat(percent);
        models.set(model, metrics);
      }
    }
    return checked(Array.from(models).filter(([, m]) => ['Easy', 'Medium', 'Hard'].every(k => k in m))
      .map(([model, metrics]) => ({ model, setting: model === 'InternVL2' ? 'Fine-tuned on AMEX and AndroidControl' : undefined, score: (metrics.Easy + metrics.Medium + metrics.Hard) / 3, metrics })), 3);
  },
};
export default board;
