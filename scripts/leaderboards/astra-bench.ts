// ASTRA-bench tests whether a tool-using assistant completes personal tasks.
// Table 4 gives macro task completion across 2,413 scenarios. Table 5 reports turns and milestone performance.
import type { Leaderboard } from './types.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2603.01357';
const levels = ['Low', 'Mod.', 'High'];
const axes = ['Referential', 'Functional', 'Informational'];
const slices = axes.flatMap(axis => levels.map(level => axis + ': ' + level));
const capabilities = ['IR Recall', 'Response Gen.', 'Payload Gen.', 'CQA', 'Entity Creation'];
const percent = (value: string) => Number((100 * numberCell(value)).toFixed(4));
const board: Leaderboard = {
  benchmark: 'astra-bench', static: 'paper', url: feed, feed,
  terms: 'Apple publishes these results under the terms listed at https://arxiv.org/abs/2603.01357.',
  parts: Object.fromEntries([...slices, ...capabilities].map(key => [key, key])),
  stats: { turns: { name: 'Average turns', unit: 'count' }, milestone: { name: 'Milestone similarity', unit: 'score', better: 'higher' } },
  aliases: { 'GPT-o3': 'o3', 'Claude-4.5-Opus': 'claude-opus-4-5', 'Claude-4.5-Haiku': 'claude-haiku-4-5',
    'Qwen-235B': 'qwen3-235b-a22b', 'Qwen-30B': 'qwen3-30b-a3b', 'Qwen-30B-Instruct': 'qwen3-30b-a3b-instruct-jul-2025' },
  async fetch() {
    const tables = inlinePaperTables(await paperHtml(feed));
    const main = tables.find(t => t[0][1] === 'Macro Avg. (n=2413)');
    const detail = tables.find(t => t[0][1] === 'Avg. Turns (n=2413)');
    if (!main || !detail || detail[0][2] !== 'Milestone Sim. (n=2413)' ||
        !slices.every((key, i) => key === main[0][i + 2] + ': ' + main[1][i + 2].split(' (')[0]) ||
        !capabilities.every((key, i) => detail[1][i + 3]?.startsWith(key + ' ('))) throw new Error('ASTRA results columns changed');
    return checked(main.slice(2).filter(r => !r[0].endsWith(' Models')).map(row => {
      const other = detail.find(r => r[0] === row[0]);
      if (!other) throw new Error('Missing milestone row for ' + row[0]);
      return { model: row[0], score: percent(row[1]), metrics: {
        turns: numberCell(other[1]), milestone: numberCell(other[2]),
        ...Object.fromEntries(slices.map((key, i) => [key, percent(row[i + 2])])),
        ...Object.fromEntries(capabilities.map((key, i) => [key, percent(other[i + 3])])),
      } };
    }), 8);
  },
};
export default board;
