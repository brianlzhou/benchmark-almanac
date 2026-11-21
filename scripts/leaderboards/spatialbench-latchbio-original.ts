// SpatialBench evaluates agents on 146 spatial transcriptomics analysis tasks.
// This importer reads the paper's aggregate model table and preserves uncertainty and efficiency fields.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const URL = 'https://arxiv.org/html/2512.21907v1';
const board: Leaderboard = {
  benchmark: 'spatialbench-latchbio-original', static: 'paper', url: URL, feed: URL, terms: PAPER_TERMS,
  stats: {
    steps: { name: 'Steps', unit: 'count' },
    latencySeconds: { name: 'Latency', unit: 'seconds', better: 'lower' },
    costUsd: { name: 'Cost', unit: 'usd', better: 'lower' },
  },
  async fetch() {
    const table = paperTables(await paperHtml(URL)).map(grid).find((rows) => rows[0]?.join('|') === 'Model|Accuracy (%)|Steps|Latency (s)|Cost (USD)');
    if (!table) throw new Error('SpatialBench aggregate model table missing');
    const rows: LeaderboardRow[] = [];
    for (const cells of table.slice(1)) {
      const scoreMatch = cells[1]?.match(/^([\d.]+)\s*\[([\d.]+),\s*([\d.]+)\]/);
      if (!cells[0] || !scoreMatch) continue;
      rows.push({ model: cells[0], score: Number(scoreMatch[1]), low: Number(scoreMatch[2]), high: Number(scoreMatch[3]), metrics: { steps: Number(cells[2].match(/[\d.]+/)?.[0]), latencySeconds: Number(cells[3].match(/[\d.]+/)?.[0]), costUsd: Number(cells[4].match(/[\d.]+/)?.[0]) } });
    }
    return checked(rows, 7);
  },
};
export default board;
