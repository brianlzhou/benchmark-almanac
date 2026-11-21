// SpatialWorld evaluates spatial reasoning in physical and digital environments.
// Table 3 reports task success rates and a Physical Overall column for 15 models.
import type { Leaderboard } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2606.09669';
const board: Leaderboard = {
  benchmark: 'spatialworld', static: 'paper', url: feed, feed,
  terms: 'The authors publish the results in the arXiv paper. https://arxiv.org/abs/2606.09669',
  parts: { daily: 'Daily', work: 'Work', entertainment: 'Entertainment', travel: 'Travel', social: 'Social' },
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t => t[0]?.[0] === 'Model' && t[1]?.[5] === 'Social');
    if (!table) throw new Error('SpatialWorld results table missing');
    const rows = table.slice(3).filter(row => row[0] && !row[0].startsWith('(')).map(row => {
      if (row.length !== 8 || !row.slice(1).every(v => /^\d+(?:\.\d+)?$/.test(v))) throw new Error('Invalid SpatialWorld row');
      return { model: row[0].replace(/ \[.*$/, ''), score: Number(row[6]), metrics: { daily: Number(row[1]), work: Number(row[2]), entertainment: Number(row[3]), travel: Number(row[4]), social: Number(row[5]), digitalEntertainment: Number(row[7]) } };
    });
    return checked(rows, 15);
  },
};
export default board;
