// SynthDocBench tests long-context visual document understanding across 200 synthetic reports.
// The headline is question accuracy at judge score 6 or higher, expressed as a percentage.
// Table 2 in the authors' paper reports overall accuracy and scores for eight named VLMs.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const URL = 'https://arxiv.org/html/2607.10400';
const board: Leaderboard = {
  benchmark: 'synthdocbench', static: 'paper', url: URL, feed: URL, terms: PAPER_TERMS,
  stats: { chart: { name: 'Chart reading accuracy', unit: '%', better: 'higher' }, complex: { name: 'Complex reasoning accuracy', unit: '%', better: 'higher' }, crossModal: { name: 'Cross modal accuracy', unit: '%', better: 'higher' } },
  async fetch(): Promise<LeaderboardRow[]> {
    const tables = paperTables(await paperHtml(URL)).map(grid);
    const table = tables.find((rows) => rows.some((row) => row.includes('SynthDocBench (Ours)')));
    if (!table) throw new Error('SynthDocBench results table missing');
    const rows: LeaderboardRow[] = [];
    for (const row of table.slice(3)) {
      const name = row[0] ?? '';
      if (!name || name === 'Proprietary Models' || name === 'Open-Weight Models') continue;
      const match = name.match(/^(.+?) \(/);
      const score = Number(row[3]);
      if (!match || !Number.isFinite(score)) throw new Error(`Unexpected SynthDocBench row: ${name}`);
      rows.push({ model: match[1], score: score * 100, metrics: {
        chart: Number(row[5]) * 100, complex: Number(row[7]) * 100, crossModal: Number(row[9]) * 100,
      }});
    }
    return checked(rows, 2);
  },
};
export default board;
