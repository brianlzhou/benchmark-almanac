// PushWorld evaluates planning agents on grid puzzles with movable obstacles and multiple goals.
// The headline score is the percentage of test puzzles solved on the complete Level 0 set.
// This importer reads Table 2 in the benchmark paper and keeps each puzzle-set result as a part metric.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const URL = 'https://arxiv.org/html/2301.10289';
const board: Leaderboard = {
  benchmark: 'pushworld', static: 'paper', url: URL, feed: URL, terms: PAPER_TERMS,
  parts: {
    base: { name: 'Base', group: 'Puzzle set' },
    largerPuzzleSizes: { name: 'Larger Puzzle Sizes', group: 'Puzzle set' },
    moreWalls: { name: 'More Walls', group: 'Puzzle set' },
    moreObstacles: { name: 'More Obstacles', group: 'Puzzle set' },
    moreShapes: { name: 'More Shapes', group: 'Puzzle set' },
    multipleGoals: { name: 'Multiple Goals', group: 'Puzzle set' },
  },
  async fetch(): Promise<LeaderboardRow[]> {
    const table = paperTables(await paperHtml(URL)).map(grid).find((rows) => rows[0]?.includes('PPO') && rows.some((row) => row[0] === 'All'));
    if (!table) throw new Error('PushWorld results table missing');
    const all = table.find((row) => row[0] === 'All');
    if (!all) throw new Error('PushWorld All row missing');
    const metrics: Record<string, number> = {};
    for (const row of table.slice(2, -1)) {
      const key = row[0].replace(/[^A-Za-z0-9]+(.)/g, (_, c) => c.toUpperCase()).replace(/^./, (c) => c.toLowerCase());
      metrics[key] = Number(row[2].replace('%', ''));
    }
    const rows = [
      { model: 'PPO', score: Number(all[2].replace('%', '')), metrics },
      { model: 'DQN', score: Number(all[4].replace('%', '')), metrics: Object.fromEntries(table.slice(2, -1).map((row) => [row[0].replace(/[^A-Za-z0-9]+(.)/g, (_, c) => c.toUpperCase()).replace(/^./, (c) => c.toLowerCase()), Number(row[4].replace('%', ''))])) },
    ];
    return checked(rows, 2);
  },
};
export default board;
