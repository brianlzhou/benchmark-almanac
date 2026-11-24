// D2K-Bench tests GPU kernel implementation. Table 1 gives geometric mean speedup
// over the first correct Fable-5 implementation and counts correct tasks out of 26.
// Table 2 reports design and implementation judge scores for the same runs.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2610.03226';
const board: Leaderboard = {
  benchmark: 'd2k-bench',
  url: feed,
  feed,
  static: 'paper',
  terms: 'The authors publish these results under the terms linked at https://arxiv.org/abs/2610.03226.',
  headline: 'Geometric mean speedup over the first correct Fable-5 submission across 26 tasks.',
  costPer: 'run',
  stats: { uncachedInput: { name: 'Uncached input tokens per run', unit: 'tokens' }, cacheWrite: { name: 'Cache-write tokens per run', unit: 'tokens' },
    cacheRead: { name: 'Cache-read tokens per run', unit: 'tokens' }, outputRun: { name: 'Output tokens per run', unit: 'tokens' }, correct: { name: 'Correct tasks', unit: 'count', better: 'higher' },
    design: { name: 'Design judge score', unit: 'score' }, implementation: { name: 'Implementation judge score', unit: 'score' },
    l1: { name: 'High-level algorithmic insights', unit: 'score' }, l2: { name: 'Dataflow design', unit: 'score' },
    l3: { name: 'Low-level optimization tricks', unit: 'score' } },
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const table = tables.find(table => table[0].includes('Expert') && table[1].join('|') === 'Model|S_{perf}|Fable-5|Correct|S_{perf}|Correct|S_{perf}|S_{perf}');
    if (!table) throw new Error('Missing reviewed results columns');
    const rows: LeaderboardRow[] = [];
    for (const cells of table.slice(2)) {
      const model = cells[0];
      if (model === 'Overall') continue;
      const judges = tables.find(t => t[1]?.join('|') === 'Model|JS_{design}|L1|L2|L3|JS_{impl}|S_{perf}|L1|L2|L3|JS_{impl}|S_{perf}');
      const judge = judges?.find(row => row[0] === model);
      if (!judge) throw new Error('Missing judge scores for ' + model);
      for (const [index, column] of [3, 5].entries()) {
        const offset = 2 + 5 * index;
        const usage: Record<string, number> = {};
        let cost: number | undefined;
        if (model === 'Claude-Opus-4.8') {
          const budget = tables.find(t => t[0]?.[0] === 'Metric' && t[0][index + 1] === table[0][column]);
          const read = (name: string) => numberCell(budget?.find(r => r[0] === name)?.[index + 1] ?? '');
          cost = read('API cost (US$)');
          usage.uncachedInput = read('Uncached input tokens (M)') * 1e6;
          usage.cacheWrite = read('Cache-write tokens (M)') * 1e6;
          usage.cacheRead = read('Cache-read tokens (M)') * 1e6;
          usage.outputRun = read('Output tokens (M)') * 1e6;
        }
        rows.push({ model, cost, setting: table[0][column], score: numberCell(cells[column + 1]), metrics: {
          ...usage, correct: numberCell(cells[column]), design: numberCell(judge[1]), implementation: numberCell(judge[offset + 3]),
          l1: numberCell(judge[offset]), l2: numberCell(judge[offset + 1]), l3: numberCell(judge[offset + 2]) } });
      }
    }
    return checked(rows, 10);
  },
};
export default board;
