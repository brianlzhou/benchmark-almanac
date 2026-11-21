// PhyRubric-Bench tests physical commonsense in generated videos.
// Table 1 reports joint performance, the percent of videos that pass both score thresholds, by domain and overall.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2611.13576';
const board: Leaderboard = {
  benchmark: 'phyrubric-bench', static: 'paper', url: feed, feed,
  terms: 'The authors publish the results in the arXiv paper. https://arxiv.org/abs/2611.13576',
  parts: { mechanics: 'Mechanics', optics: 'Optics', heat: 'Heat', electricity: 'Electricity', acoustics: 'Acoustics' },
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t => t[1]?.join('|') === 'Model|SA|PC|JP|SA|PC|JP|SA|PC|JP|SA|PC|JP|SA|PC|JP|SA|PC|JP');
    if (!table) throw new Error('PhyRubric-Bench results table missing');
    const rows: LeaderboardRow[] = [];
    for (const row of table.slice(3)) {
      if (!row[0] || ['Proprietary Models', 'Open-Source Models'].includes(row[0])) continue;
      if (row.length !== 19 || !/^\d+(?:\.\d+)?$/.test(row[18])) throw new Error('Invalid PhyRubric-Bench row');
      const metrics: Record<string, number> = {};
      for (const [key, index] of Object.entries({ mechanics: 3, optics: 6, heat: 9, electricity: 12, acoustics: 15 })) {
        if (!/^\d+(?:\.\d+)?$/.test(row[index])) throw new Error('Invalid PhyRubric-Bench domain score');
        metrics[key] = Number(row[index]);
      }
      rows.push({ model: row[0].replace(/ \[.*$/, ''), score: Number(row[18]), metrics });
    }
    return checked(rows, 10);
  },
};
export default board;
