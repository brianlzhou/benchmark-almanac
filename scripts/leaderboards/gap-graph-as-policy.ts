// The source reports no overall score. The headline is the plain mean of the 3 simulation benchmarks, computed by this importer.
// GaP tests graph-based robotic policies for grocery-order, grocery-packing, and popcorn tasks. Table 3 reports success rates before and after learning.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2607.05369';
export default {
  benchmark: 'gap-graph-as-policy', static: 'paper', url: feed, feed,
  terms: 'Paper and license at https://arxiv.org/abs/2607.05369',
  headline: 'The paper reports no overall score, so this is the plain mean of its three simulation benchmark success rates.',
  parts: { I: 'I. Fulfill Grocery Orders', II: 'II. Pack Grocery Items', III: 'III. Make Popcorn' },
  async fetch(): Promise<LeaderboardRow[]> {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t => t[0]?.[1] === 'Success Rate \\uparrow' && t[1]?.[0] === 'Benchmark');
    if (!table) throw new Error('Missing GaP Table 3');
    const cols = ['TiPToP', 'TiPToP w/ MORSL', 'GaP (Initial)', 'GaP (Learned)'];
    const rows = cols.map((model, i) => {
      const values = table.slice(2).map(row => Number(row[i + 1]) * 100);
      if (values.length !== 3 || !values.every(Number.isFinite)) throw new Error('Incomplete GaP success rates');
      return { model, score: values.reduce((a, b) => a + b, 0) / values.length, metrics: { I: values[0], II: values[1], III: values[2] } };
    });
    return checked(rows, 4);
  },
} satisfies Leaderboard;
