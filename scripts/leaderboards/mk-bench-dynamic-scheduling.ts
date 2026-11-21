// MK-Bench tests dynamic job-shop scheduling on ten Brandimarte instances.
// Table G.2 reports average makespan relative percentage deviation. Lower is better.
// Table 3 reports the average rank for the same runs.
import type { Leaderboard } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2508.01724';
const models: Record<string, string> = {
  'Q3-8b': 'Qwen3-8B', 'Q3-14b': 'Qwen3-14B', 'Q3-32b': 'Qwen3-32B',
  'DS-V3.2': 'DeepSeek-V3.2', 'GPT-5n': 'GPT-5 nano',
};
const board: Leaderboard = {
  benchmark: 'mk-bench-dynamic-scheduling', url: feed, feed, static: 'paper',
  terms: 'The authors publish the paper under the license linked at https://arxiv.org/abs/2508.01724.',
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const detail = tables.find(t => t[0][0] === 'Instance' && t[2]?.[0] === 'MK01');
    const summary = tables.find(t => t[2]?.[0] === 'MK-Bench' && t[2][1] === 'Avg. RPD (%)');
    if (!detail || detail.length !== 13 || detail.at(-1)?.[0] !== 'Average' || summary?.[3]?.[1] !== 'Avg. Rank') {
      throw new Error('Missing MK-Bench results or ranks');
    }
    const instances = detail.slice(2, -1);
    board.parts = Object.fromEntries(instances.map(r => [r[0], r[0]]));
    const rows = detail[1].slice(1).flatMap((label, i) => {
      if (label === 'GP') return []; // Genetic programming baseline
      const col = i + 1;
      const score = numberCell(detail.at(-1)![col]);
      if (summary[1][col + 1].toLowerCase() !== label.toLowerCase() || numberCell(summary[2][col + 1]) !== score) {
        throw new Error('MK-Bench tables disagree');
      }
      const metrics = Object.fromEntries(instances.map(r => [r[0], numberCell(r[col])]));
      metrics.avgRank = numberCell(summary[3][col + 1]);
      return [{ model: models[label] ?? label, harness: models[label] ? 'ReflecSched' : undefined, score, metrics }];
    });
    return checked(rows, 9);
  },
};
export default board;
