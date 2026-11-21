// SVAMP tests arithmetic word-problem solvers on its challenge set.
// Table 10 reports full-set accuracy for three model families, with scratch and RoBERTa variants.
// The benchmark paper's challenge-set results are the source.
import type { Leaderboard } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
const url = 'https://arxiv.org/html/2103.07191';
export default {
  benchmark: 'svamp', static: 'paper', url, feed: url,
  terms: 'The authors publish Table 10 on arXiv. https://arxiv.org/abs/2103.07191',
  async fetch() {
    const table = paperTables(await paperHtml(url)).map(grid).find(t =>
      t[0]?.[1] === 'Seq2Seq' && t[1]?.[0] === '' && t[2]?.[0] === 'Full Set');
    if (!table) throw new Error('Missing SVAMP challenge results');
    const models = table[0].slice(1).map((name, i) => [name, table[1][i + 1]] as const);
    const rows = table.slice(2).map(c => {
      if (!c[0] || !/^\d+(?:\.\d+)?$/.test(c[1])) throw new Error('Invalid SVAMP result row');
      return models.map(([model, setting], i) => ({ model, setting: setting === 'S' ? 'Scratch' : 'RoBERTa',
        score: Number(c[i + 1]), trials: 1000 }));
    }).flat();
    return checked(rows, 6);
  },
} satisfies Leaderboard;
