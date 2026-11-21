// PLM-VideoBench tests video understanding with fine-grained QA, scene grounding, captioning and localization.
// Table 5 reports the mean of five video task scores in its Avg. column.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2504.13180';
const board: Leaderboard = {
  benchmark: 'plm-videobench', static: 'paper', url: feed, feed,
  terms: 'The authors publish the results in the arXiv paper. https://arxiv.org/abs/2504.13180',
  parts: { fgqa: 'FGQA MBAcc', sgqa: 'SGQA accuracy', rdcap: 'RDCap SODA', rcap: 'RCap score', rtloc: 'RTLoc meanR' },
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).filter(t => t[0]?.join('|') === 'Model|FGQA MBAcc|SGQA acc †|RDCap SODA†|RCap score†|RTLoc meanR|Avg.').at(-1);
    if (!table) throw new Error('PLM-VideoBench results table missing');
    const rows: LeaderboardRow[] = [];
    for (const row of table.slice(1)) {
      if (!row[0] || ['Human perf.', 'Proprietary', '1B scale', '3B scale', '8B scale', 'Open-access'].includes(row[0])) continue;
      if (row.length !== 7 || !row.slice(1).every(v => /^\d+(?:\.\d+)?$/.test(v))) throw new Error('Invalid PLM-VideoBench row');
      rows.push({ model: row[0].replace(/ \[.*$/, ''), score: Number(row[6]), metrics: { fgqa: Number(row[1]), sgqa: Number(row[2]), rdcap: Number(row[3]), rcap: Number(row[4]), rtloc: Number(row[5]) } });
    }
    return checked(rows, 9);
  },
};
export default board;
