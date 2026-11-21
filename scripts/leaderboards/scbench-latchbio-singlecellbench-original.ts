// scBench evaluates language-model agents on 394 single-cell analysis questions.
// This importer reads the paper's overall model-performance table and preserves its 95% intervals and latency.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const URL = 'https://arxiv.org/html/2602.09063v1';
const board: Leaderboard = {
  benchmark: 'scbench-latchbio-singlecellbench-original', static: 'paper', url: URL, feed: URL, terms: PAPER_TERMS,
  async fetch() {
    const table = paperTables(await paperHtml(URL)).map(grid).find((rows) => rows[0]?.join('|') === 'Model|Provider|Accuracy (%)|95% CI|Latency (s)');
    if (!table) throw new Error('scBench overall model table missing');
    const rows: LeaderboardRow[] = [];
    for (const cells of table.slice(1)) {
      const interval = cells[3]?.match(/\(([\d.]+),\s*([\d.]+)\)/);
      const score = Number(cells[2]);
      if (!cells[0] || !Number.isFinite(score) || !interval) continue;
      rows.push({ model: cells[0], score, low: Number(interval[1]), high: Number(interval[2]), metrics: { latencySeconds: Number(cells[4]) } });
    }
    return checked(rows, 8);
  },
};
export default board;
