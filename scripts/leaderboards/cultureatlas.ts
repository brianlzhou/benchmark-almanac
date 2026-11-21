// CultureAtlas tests whether models recognize true and false cultural knowledge statements.
// Table 5 reports F-score for All Culture, plus precision, recall and results by resource level.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2402.09369';
const groups = ['All Culture', 'High Resource', 'Mid Resource', 'Low Resource'];
const measures = ['P', 'R', 'F'];
const board: Leaderboard = {
  benchmark: 'cultureatlas', url: feed, feed, static: 'paper', terms: PAPER_TERMS + ' https://arxiv.org/licenses/',
  aliases: { 'Vicuna 13B': 'vicuna-13b-v1-3' },
  parts: Object.fromEntries(groups.slice(1).map(name => [name.replace(' ', '') + 'F', name])),
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const table = tables.find(t => t[0]?.slice(3).join('|') === groups.flatMap(g => [g,g,g]).join('|'));
    if (!table || table[1].slice(3).join('|') !== groups.flatMap(() => measures).join('|')) throw Error('Missing Table 5 columns');
    let family = '';
    const rows: LeaderboardRow[] = [];
    for (const [label, size, setting, ...cells] of table.slice(2)) {
      if (label) family = label;
      if (!family || !size || !setting || cells.length !== 12 || cells.some(v => !v || !Number.isFinite(Number(v)))) throw Error('Unexpected culture results row');
      const keys = groups.flatMap(group => measures.map(m => group.replace(' ', '') + m));
      const metrics = Object.fromEntries(keys.map((key, i) => [key, Number(cells[i])]));
      rows.push({ model: family + ' ' + size, setting, score: metrics.AllCultureF, metrics });
    }
    return checked(rows, 7);
  },
};
export default board;
