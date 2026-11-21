// Ego2Flow measures how a driving policy affects surrounding traffic. Table 3 reports total score from 0 to 100.
// The eight efficiency, safety, stability and energy scores use a zero-to-one scale. Failure fraction is lower-is-better.
import type { Leaderboard } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2611.17720';
const labels = ['delay score', 'throughput score', 'collision score', 'low-TTC score', 'braking score',
  'speed SD score', 'peak loss score', 'energy score', 'failure fraction', 'total score'];
const board: Leaderboard = {
  benchmark: 'ego2flow', url: feed, feed, static: 'paper',
  terms: 'The authors publish the paper and its terms at https://arxiv.org/abs/2611.17720.',
  parts: Object.fromEntries(labels.slice(0, 8).map(name => [name, { name, unit: 'score', note: 'Normalized from 0 to 1.' }])),
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t =>
      t[1]?.slice(1).map(c => c.replace(/\s+\\(?:up|down)arrow$/, '')).join('|') === labels.join('|'));
    if (!table || table[2]?.at(-1) !== '[0,100]') throw new Error('Missing Ego2Flow total score');
    return checked(table.slice(3).map(([model, ...cells]) => {
      if (cells.length !== labels.length) throw new Error('Incomplete Ego2Flow result');
      const values = cells.map(numberCell);
      return { model, score: values[9], metrics: Object.fromEntries(labels.slice(0, 9).map((l, i) => [l, values[i]])) };
    }), 5);
  },
};
export default board;
