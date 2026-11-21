// WildJailbreak tests safety on harmful requests and compliance on benign requests.
// Table 6 gives WJ-all accuracy for each trained variant. Appendix tables add training ablations.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2406.18510';
export default {
  benchmark: 'wildjailbreak', static: 'paper', url: 'https://arxiv.org/abs/2406.18510', feed,
  terms: 'arXiv robots.txt allows the HTML paper. The WildJailbreak authors publish the comparison.',
  parts: { harmful: { name: 'Harmful attack success rate', better: 'lower' },
    benign: { name: 'Benign refusal rate', better: 'lower' } },
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const main = tables.find(t => t[1]?.[10]?.includes('WJ') && t[2]?.[0] === 'Train Data');
    if (!main || main.length < 13 || !main[2][10].startsWith('acc')) throw new Error('WildJailbreak main table changed');
    const rows: LeaderboardRow[] = [];
    function add(cells: string[], col: number, prefix = '') {
      rows.push({ model: cells[0].includes('13B') ? 'Tulu2-13B' : 'Tulu2-7B',
        setting: prefix + cells[0], score: numberCell(cells[col]),
        metrics: { harmful: numberCell(cells[col + 1]), benign: numberCell(cells[col + 2]) } });
    }
    for (const cells of main.slice(3)) add(cells, 10);
    const extras = tables.filter(t => t[0]?.[3] === 'WJ' && t[1]?.[3]?.startsWith('acc'));
    if (extras.length !== 4) throw new Error('WildJailbreak ablation tables changed');
    for (const table of extras) {
      const half = table[2][0] === 'Tulu2Mix-no-refusal 1/2';
      for (const cells of table.slice(2)) {
        // The other training mixtures and the 200K run already appear in the main table.
        if (half || /^\+ WJ-all-(20|40|80|120|160)K$/.test(cells[0]) || /^\+ (dan|hhrlhf|saferlhf)/.test(cells[0]))
          add(cells, 3, half && cells[0].startsWith('+') ? 'Tulu2Mix-no-refusal 1/2 ' : '');
      }
    }
    if (rows.length < 45) throw new Error('Missing WildJailbreak training configurations');
    return rows;
  },
} satisfies Leaderboard;
