// The source reports no overall score. The headline is the plain mean of the 6 parts, computed by this importer.
// DARE-Bench tests data science instruction following, modeling and forecasting. The README's full evaluation
// covers 352 tasks. The released subset covers 324 of them and has separate metrics.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://github.com/Snowflake-Labs/dare-bench';
const feed = 'https://raw.githubusercontent.com/Snowflake-Labs/dare-bench/main/README.md';
const labels = ['Class-IF', 'Class-MM', 'Reg-IF', 'Reg-MM', 'TS-XF', 'TS-CF'];
function table(section: string) {
  const block = section.split('| Model | ' + labels.join(' | ') + ' |')[1]?.trim().split(/\n\s*\n/)[0];
  if (!block) throw new Error('Missing DARE-Bench task columns');
  return new Map(block.split('\n').slice(1).map(line => {
    const [model, ...cells] = line.replace(/\*\*/g, '').split('|').slice(1, -1).map(s => s.trim());
    if (!model || cells.length !== labels.length || !cells.every(c => /^\d+\.\d+$/.test(c))) throw new Error('Invalid DARE-Bench row');
    return [model, cells.map(Number)] as const;
  }));
}
const board: Leaderboard = {
  benchmark: 'dare-bench', url, feed, parts: Object.fromEntries([...labels.map(label => [label, label]), ...labels.map(label => ['released' + label, {name: label, group: 'Released subset'}])]),
  terms: 'The repository releases its non-database files under Apache 2.0. https://github.com/Snowflake-Labs/dare-bench#license',
  aliases: { 'GPT-o4-mini': 'o4-mini', 'Claude-Sonnet-3.7': 'claude-3-7-sonnet', 'Claude-Sonnet-4': 'claude-sonnet-4' },
  async fetch() {
    const results = (await fetchText(feed)).split('## Results')[1];
    const [released, full] = results.split('Full Evaluation Results (as reported in paper)');
    const subset = table(released);
    const rows = [...table(full)].map(([model, cells]) => {
      const metrics = Object.fromEntries(labels.map((label, i) => [label, cells[i]]));
      const other = subset.get(model);
      if (other) labels.forEach((label, i) => { metrics['released' + label] = other[i]; });
      return { model, score: cells.reduce((a, b) => a + b, 0) / labels.length, metrics };
    });
    checked(rows.map(row => ({ ...row })), 8);
    return rows;
  },
};
export default board;
