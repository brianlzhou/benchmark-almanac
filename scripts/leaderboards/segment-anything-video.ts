// Segment Anything Video evaluates interactive video segmentation.
// Table 5 reports average 1-click and 5-click mIoU across 37 datasets for SAM and SAM 2.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2408.00714';
const board: Leaderboard = {
  benchmark: 'segment-anything-video', static: 'paper', url: feed, feed,
  terms: 'The authors publish the results in the arXiv paper. https://arxiv.org/abs/2408.00714',
  parts: { sa23All1Click: 'SA-23 All 1-click mIoU', sa23All5Click: 'SA-23 All 5-click mIoU' },
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t => t[1]?.[0] === 'Model' && t[1]?.[2] === 'SA-23 All');
    if (!table) throw new Error('Segment Anything Video results table missing');
    const rows: LeaderboardRow[] = table.slice(2).map(row => {
      if (row.length !== 7 || !/^\d+(?:\.\d+)? \(\d+(?:\.\d+)?\)$/.test(row[2])) throw new Error('Invalid Segment Anything Video row');
      const m = row[2].match(/^(\d+(?:\.\d+)?) \((\d+(?:\.\d+)?)\)$/)!;
      return { model: row[0], setting: row[1], score: Number(m[1]), metrics: { sa23All1Click: Number(m[1]), sa23All5Click: Number(m[2]) } };
    });
    return checked(rows, 3);
  },
};
export default board;
