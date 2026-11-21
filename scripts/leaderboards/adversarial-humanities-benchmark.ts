// The Adversarial Humanities Benchmark measures attack success rate on harmful humanities prompts.
// Lower overall ASR is better. Table 4 provides the overall percentage and hazard-wise ASRs.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const FEED = 'https://arxiv.org/html/2604.18487';
const board: Leaderboard = {
  benchmark: 'adversarial-humanities-benchmark', static: 'paper',
  url: 'https://arxiv.org/abs/2604.18487', feed: FEED,
  terms: 'The authors publish the paper under the arXiv terms of use. https://arxiv.org/abs/2604.18487',
  async fetch(): Promise<LeaderboardRow[]> {
    const tables = paperTables(await paperHtml(FEED)).map(grid);
    const table = tables.find((t) => t[0]?.[0] === 'Model' && t[0]?.[1] === 'Overall');
    if (!table) throw new Error('AHB Table 4 missing');
    const keys = table[0].slice(2);
    const rows = table.slice(1).map((row) => ({
      model: row[0], score: Number(row[1]), metrics: Object.fromEntries(keys.map((key, i) => [key, Number(row[i + 2])])),
    }));
    return checked(rows, 30);
  },
};
export default board;
