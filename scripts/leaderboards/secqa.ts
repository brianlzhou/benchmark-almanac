// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// SecQA tests multiple-choice computer security knowledge. Table 3 gives accuracy on both difficulty levels.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2312.15838';
const board: Leaderboard = {
  benchmark: 'secqa', url: feed, feed, static: 'paper',
  terms: 'Table 3 is credited to Zefang Liu under the paper terms linked at https://arxiv.org/abs/2312.15838.',
  parts: { v1: 'SecQA v1', v2: 'SecQA v2' },
  headline: 'The paper reports no overall accuracy, so this is the plain mean of SecQA v1 and v2 accuracy.',
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t => t[0]?.join('|') === 'Model|0-Shot|5-Shot');
    if (!table) throw new Error('SecQA Table 3 is missing');
    const v2Start = table.findIndex(r => r[0] === 'SecQAv2 Dataset');
    if (table[1]?.[0] !== 'SecQAv1 Dataset' || v2Start < 3) throw new Error('SecQA dataset sections changed');
    const v2 = new Map(table.slice(v2Start + 1).map(r => [r[0], r]));
    const rows: LeaderboardRow[] = [];
    for (const [model, ...v1Scores] of table.slice(2, v2Start)) {
      const second = v2.get(model);
      if (!second) continue;
      for (const [index, setting] of ['0-shot', '5-shot'].entries()) {
        const metrics = { v1: numberCell(v1Scores[index]), v2: numberCell(second[index + 1]) };
        rows.push({ model, setting, metrics, score: (metrics.v1 + metrics.v2) / 2 });
      }
    }
    return checked(rows, 16);
  },
};
export default board;
