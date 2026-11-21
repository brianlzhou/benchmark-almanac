// RGraph-Eval compares robot manipulation videos with reference demonstrations.
// Table 4 reports the combined score and its object, relation and 3D path components across 30 scenes.
import type { Leaderboard } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
const url = "https://arxiv.org/html/2610.31121";
export default {
  benchmark: "rgraph-eval", static: 'paper', url, feed: url,
  terms: 'The authors publish these results on arXiv. https://arxiv.org/abs/2610.31121',
  parts: {"objects":"Visible-object F1","relations":"Relation changes","trajectory":"3D path shape"},
  async fetch() {
    const tables = paperTables(await paperHtml(url)).map(grid);
    const table = tables.find(t => t[0]?.join('|') === 'Generator|O|R|T|RGraph-Eval');
    if (!table) throw new Error('Missing rgraph-eval results table');
    const rows = table.slice(1).map(c => {
      const num = (s: string) => { if (!/^-?\d+(?:\.\d+)?%?$/.test(s)) throw new Error('Invalid score: ' + s); return parseFloat(s); };
      return { model: c[0].split(' (')[0], score: num(c[4]),
        metrics: Object.fromEntries([["objects",1],["relations",2],["trajectory",3]].map(([key, col]) => [key, num(c[Number(col)])])),
      };
    });
    return checked(rows, 3);
  },
} satisfies Leaderboard;
