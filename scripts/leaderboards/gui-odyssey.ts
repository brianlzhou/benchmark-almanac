// GUI Odyssey tests navigation across mobile apps. Table 2 reports action matching scores
// for high-level and low-level instructions on the random test split.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2406.08451';
const categories = ['Tool', 'Information', 'Shopping', 'Media', 'Social', 'Multi-Apps'];
const board: Leaderboard = {
  benchmark: 'gui-odyssey', url: feed, feed, static: 'paper',
  terms: 'The authors publish Table 2 under the terms linked at https://arxiv.org/abs/2406.08451.',
  parts: Object.fromEntries(categories.map(name => [name, name])),
  async fetch() {
    const header = ['Model', ...[...categories, 'Overall'].flatMap(name => [name, name])];
    const table = flatPaperTables(await paperHtml(feed)).map(grid).find(t => t[0]?.join('|') === header.join('|'));
    if (!table || !table[1].slice(1).every((v, i) => v === (i % 2 ? 'LL' : 'HL'))) throw new Error('Missing action matching columns');
    const rows: LeaderboardRow[] = [];
    let group = '';
    for (const r of table.slice(2)) {
      if (r.every(value => value === r[0])) {
        group = r[0];
        if (!['zero-shot', 'zero-shot with OmniParser', 'fine-tuned'].includes(group)) throw new Error('Unknown evaluation group');
        continue;
      }
      const semantic = r[0].includes('\\ast');
      const model = r[0].replace(/\\textbf|\^\{\\ast\}|[{}]/g, '');
      for (const [i, level] of ['High-level', 'Low-level'].entries()) {
        const setting = [group.split(' with ')[0], level + ' instructions', ...(semantic ? ['semantic annotations'] : [])].join(', ');
        const metrics = Object.fromEntries(categories.map((name, j) => [name, numberCell(r[1 + 2 * j + i])]));
        rows.push({ model, setting, metrics, harness: group.includes('OmniParser') ? 'OmniParser' : undefined, score: numberCell(r[13 + i]) });
      }
    }
    return checked(rows, 28);
  },
};
export default board;
