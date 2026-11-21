// BRoverbs tests Brazilian proverb comprehension in both directions. Table 1 gives accuracy
// for proverb to story, story to proverb, and the authors' rounded average as fractions.
import type { Leaderboard } from './types.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
const url = 'https://arxiv.org/html/2509.08960';
const board: Leaderboard = {
  benchmark: 'broverbs', static: 'paper', url, feed: url,
  terms: 'Author results published under the license at https://arxiv.org/abs/2509.08960.',
  parts: { pts:'Proverb to Story', stp:'Story to Proverb' },
  aliases: { 'Llama1-7B':'llama-7b' },
  async fetch() {
    const table = paperTables(await paperHtml(url)).map(grid).find(t => t[0]?.join('|') === 'Model|Model size|Pretrain size|PtS|StP|Average');
    if (!table) throw new Error('Missing BRoverbs Table 1');
    const rows = table.slice(1).filter(c => !c.every(v => v === c[0])).map(c => {
      if (c.length !== 6) throw new Error('Unexpected BRoverbs row');
      const [pts,stp,score] = c.slice(3).map(v => numberCell(v)*100);
      return { model:c[0].split(' [')[0], score, metrics:{pts,stp}, params:c[1].endsWith('B') ? parseFloat(c[1]) : undefined };
    });
    return checked(rows,19);
  },
};
export default board;
