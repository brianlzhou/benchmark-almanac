// Epic-tent-O tests online detection of mistakes while pitching a tent. Table 2 reports F1,
// precision, and recall. Use the video-input rows and exclude runs with oracle step recognition.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2404.01933';

const board: Leaderboard = {
  benchmark: 'epic-tent-o', url: feed, feed, static: 'paper',
  terms: "The authors publish the results under the terms on the paper record. https://arxiv.org/abs/2404.01933",
  harnesses: 'system', aliases: {'LLAMA':'llama-2-7b'},
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const table = tables.find(t => t[0]?.[6] === 'Epic-tent-O' && t[1]?.slice(6).join('|') === 'Precision|Recall|F1 score');
    if (!table) throw new Error('Missing Epic-tent-O scores');
    const rows: LeaderboardRow[] = [];
    for (const [method,recognizer,anticipator,,,,precision,recall,f1] of table.slice(2)) {
      if (recognizer === 'Oracle') continue;
      const prego = method === 'PREGO';
      const model = prego ? anticipator : method.replace(/\s*\[.*?\]/g,'').trim();
      const harness = prego ? 'PREGO with ' + recognizer.replace(/\s*\[.*?\]/g,'').trim() : undefined;
      rows.push({model,harness,score:numberCell(f1),metrics:{precision:numberCell(precision),recall:numberCell(recall)}});
    }
    return checked(rows, 4);
  },
};
export default board;
