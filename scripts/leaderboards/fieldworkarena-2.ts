// FieldWorkArena tests multimodal agents on factory, warehouse and retail tasks.
// Table 2 reports accuracy on all 886 tasks. Table 3 breaks down perception accuracy.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2505.19662';
const categories = ['Perception','Decision making','Combination'];
const subtasks = ['Extract documents','Abstract from images','Abstract from videos','Spational from images','Spatiotemporal from videos','Temporal from videos'];
const board: Leaderboard = {
  benchmark: 'fieldworkarena-2', url: feed, feed, static: 'paper',
  terms: "The authors publish the results under the terms on the paper record. https://arxiv.org/abs/2505.19662",
  parts: Object.fromEntries([...categories,...subtasks].map(name => [name,{name,unit:'%' as const}])),
  aliases: {'GPT-4o (2024-08-06)':'gpt-4o-aug-2024'},
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const main = tables.find(t => t[1]?.[0] === 'Perception (711)');
    const detail = tables.find(t => t[0]?.[0] === 'Perception sub-task');
    if (!main || !detail || main[0].slice(1).join('|') !== detail[0].slice(1).join('|')) throw new Error('Missing FieldWorkArena results');
    const total = main.find(r => r[0] === 'Total');
    if (!total) throw new Error('Missing total accuracy');
    const rows: LeaderboardRow[] = main[0].slice(1).map((name,index) => {
      const col = index + 1;
      const metrics: Record<string,number> = {};
      for (const [table,labels] of [[main,categories],[detail,subtasks]] as const) {
        for (const label of labels) {
          const row = table.find(r => r[0].startsWith(label + ' ('));
          if (!row) throw new Error('Missing task: ' + label);
          metrics[label] = 100 * numberCell(row[col]);
        }
      }
      const model = name.startsWith('Gemini') ? name + ' (snapshot unspecified)' : name;
      return {model:model === 'GPT-4o' ? 'GPT-4o (2024-08-06)' : model, score:100 * numberCell(total[col]),metrics};
    });
    return checked(rows,5);
  },
};
export default board;
