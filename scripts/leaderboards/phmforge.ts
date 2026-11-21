// PHMForge tests agent reasoning about industrial assets, faults and maintenance.
// Table 4 reports pass@1 for all 99 scenarios and for each of five task categories.
import type { Leaderboard } from './types.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell, paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
const feed = 'https://arxiv.org/html/2604.01532';
const categories = ['RUL','Fault','Health','Cost','Safety'];
const board: Leaderboard = {
  benchmark: 'phmforge', static: 'paper', feed, url: feed, terms: PAPER_TERMS + ' https://arxiv.org/licenses/',
  parts: Object.fromEntries(categories.map(k => [k,k])),
  aliases: { 'Opus 4.6': 'claude-opus-4-6', 'Sonnet 4.5': 'claude-sonnet-4-5' },
  async fetch() {
    const table = flatPaperTables(await paperHtml(feed)).map(grid).find(t =>
      t[0]?.join('|') === ['Framework + Model','Pass@1',...categories].join('|') && t[1]?.join('|') === '||(20)|(20)|(39)|(7)|(13)');
    if (!table) throw Error('Missing full 99-scenario results');
    return checked(table.slice(2).map(([name,...cells]) => {
      const [harness,model] = name.split(' + ');
      if (!model || cells.length !== 6 || cells.some(c => !c.endsWith('%'))) throw Error('Invalid PHMForge result');
      const [score,...values] = cells.map(c => numberCell(c.slice(0,-1)));
      return { harness, model, score, metrics: Object.fromEntries(categories.map((k,i) => [k,values[i]])) };
    }), 2);
  },
};
export default board;
