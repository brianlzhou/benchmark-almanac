// SVAMP tests arithmetic word-problem solvers on its challenge set.
// The paper's challenge-set table reports accuracy for three model families, each trained from scratch (S) and
// with RoBERTa embeddings (R). Its "Full Set" row is the headline. The rows below it score parts of the set: by
// the number of operations and by the operation. The first version of this importer turned every row into a
// headline score, so each model appeared seven times and the sync refused the table (fixed 2026-11-23).
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
const url = 'https://arxiv.org/html/2103.07191';
const PARTS: Record<string, { key: string; name: string; group: string }> = {
  'One-Op': { key: 'oneOp', name: 'One operation', group: 'Operations' },
  'Two-Op': { key: 'twoOp', name: 'Two operations', group: 'Operations' },
  ADD: { key: 'add', name: 'Addition', group: 'Operation' },
  SUB: { key: 'sub', name: 'Subtraction', group: 'Operation' },
  MUL: { key: 'mul', name: 'Multiplication', group: 'Operation' },
  DIV: { key: 'div', name: 'Division', group: 'Operation' },
};
export default {
  benchmark: 'svamp', static: 'paper', url, feed: url,
  terms: 'The authors publish the challenge-set results on arXiv. https://arxiv.org/abs/2103.07191',
  parts: Object.fromEntries(Object.values(PARTS).map(({ key, name, group }) => [key, { name, group }])),
  async fetch() {
    const table = paperTables(await paperHtml(url)).map(grid).find(t =>
      t[0]?.[1] === 'Seq2Seq' && t[1]?.[0] === '' && t[2]?.[0] === 'Full Set');
    if (!table) throw new Error('Missing SVAMP challenge results');
    const models = table[0].slice(1).map((name, i) => [name, table[1][i + 1]] as const);
    const full = table.find(c => c[0] === 'Full Set')!;
    const rows: LeaderboardRow[] = models.map(([model, variant], i) => {
      const metrics: Record<string, number> = {};
      for (const c of table.slice(2)) if (PARTS[c[0]]) metrics[PARTS[c[0]].key] = numberCell(c[i + 1]);
      if (Object.keys(metrics).length !== Object.keys(PARTS).length) throw new Error('SVAMP challenge table rows changed');
      return { model, setting: variant === 'S' ? 'Scratch' : 'RoBERTa', score: numberCell(full[i + 1]), metrics };
    });
    return checked(rows, 6);
  },
} satisfies Leaderboard;
