// AndroidWorld-Knowledge tests smartphone tasks that require procedural knowledge.
// Table 2 gives success rate for six agent frameworks, all using GPT-4o as their base model.
import type { Leaderboard } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2502.17110';
export default {
  benchmark: 'androidworld-knowledge', url: feed, feed, static: 'paper', harnesses: 'system',
  terms: 'The paper and license are at https://arxiv.org/abs/2502.17110',
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t => t[0].join('|') === 'Method|SR');
    if (!table) throw new Error('Missing AndroidWorld-Knowledge table');
    return checked(table.slice(1).map(([name,sr]) => ({
      model: 'GPT-4o', harness: name.replace(/\s*\(.*\)$/,''),
      setting: name.includes('(Ours)') ? 'Operation Video' : 'Manually Written', score: numberCell(sr),
    })),6);
  },
} satisfies Leaderboard;
