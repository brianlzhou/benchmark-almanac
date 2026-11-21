// OS-Kairos tests whether GUI agents can complete complex tasks on Android.
// Table 2 reports task success rate (TSR) and action-level results in the zero-shot setting.
import type { Leaderboard } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://arxiv.org/html/2503.16465';
const parts = { scroll: 'Scroll', press: 'Press', stop: 'Stop', clickType: 'Click type accuracy',
  clickSR: 'Click step success rate', typeType: 'Type action type accuracy', typeSR: 'Type action step success rate' };
const keys = [...Object.keys(parts), 'totalType', 'totalSR'];

export default {
  benchmark: 'os-kairos', static: 'paper', url, feed: url, parts,
  terms: 'The authors publish Table 2 on arXiv. https://arxiv.org/abs/2503.16465',
  async fetch() {
    const tables = paperTables(await paperHtml(url)).map(grid);
    const header = ['Models', 'API', 'SCROLL', 'PRESS', 'STOP', 'CLICK', 'CLICK', 'TYPE', 'TYPE', 'Total', 'Total', 'TSR'];
    const table = tables.find(t => JSON.stringify(t[0]) === JSON.stringify(header) && t.some(r => r[0] === 'GLM-4V-Plus'));
    if (!table || !table[1][10].startsWith('SR (%)')) throw new Error('Missing Table 2 success rates');
    return checked(table.slice(2).map(([model, , ...cells]) => {
      const values = cells.map(c => Number(c.split(' ')[0]));
      if (cells.length !== 10 || !values.every(Number.isFinite)) throw new Error('Invalid action scores for ' + model);
      return { model, score: values[9], setting: 'Zero-shot', metrics: Object.fromEntries(keys.map((k, i) => [k, values[i]])) };
    }), 7);
  },
} satisfies Leaderboard;
