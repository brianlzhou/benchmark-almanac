// The source reports no overall score. The headline is the plain mean of the 4 parts, computed by this importer.
// VIMA-Bench measures robot manipulation success across four levels of generalization.
// Table 10 gives Figure 4's success rates for four architectures at seven controller sizes.
import type { Leaderboard } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2210.03094';
const sizes = ['2M', '4M', '9M', '20M', '43M', '92M', '200M'];
const parts = { L1: 'Placement generalization', L2: 'Combinatorial generalization', L3: 'Novel object generalization', L4: 'Novel task generalization' };
const board: Leaderboard = {
  benchmark: 'vima-bench', url: feed, feed, static: 'paper', parts,
  terms: 'The authors publish the benchmark paper on arXiv. https://arxiv.org/abs/2210.03094',
  headline: 'The paper reports no overall success rate, so the headline is the plain mean across its four generalization levels.',
  async fetch() {
    const table = flatPaperTables(await paperHtml(feed)).map(grid).find(t => t[0].join('|') === ['Level', 'Method', ...sizes].join('|'));
    if (!table) throw Error('Missing model scaling results');
    const models = new Map<string, Record<string, number>>();
    for (const [level, method, ...cells] of table.slice(1)) {
      if (!(level in parts) || cells.length !== sizes.length) throw Error('Invalid model scaling row');
      const model = method === 'Ours' ? 'VIMA' : method.replace('VIMA -', 'VIMA-');
      cells.forEach((cell, i) => {
        const value = cell.match(/(\d+\.\d+)\}*$/);
        if (!value) throw Error('Invalid success rate: ' + cell);
        const name = model + '-' + sizes[i];
        const metrics = models.get(name) ?? {};
        if (level in metrics) throw Error('Duplicate ' + name + ' ' + level);
        metrics[level] = Number(value[1]);
        models.set(name, metrics);
      });
    }
    return checked([...models].map(([model, metrics]) => {
      if (Object.keys(metrics).length !== 4) throw Error('Incomplete ' + model);
      return { model, metrics, score: (metrics.L1 + metrics.L2 + metrics.L3 + metrics.L4) / 4 };
    }), 28);
  },
};
export default board;
