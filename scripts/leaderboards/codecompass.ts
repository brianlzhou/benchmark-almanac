// The source reports no overall score. The headline is the plain mean of the 2 parts, computed by this importer.
// CodeCompass tests generated programs with the SAGA verifier. Table 6 reports Pass@1 in C++ and Python.
import type { Leaderboard } from './types.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2507.06920';
const board: Leaderboard = {
  benchmark: 'codecompass', feed, url: feed, static: 'paper',
  headline: 'The paper reports no overall score, so this is the plain mean of C++ and Python Pass@1.',
  terms: 'The authors publish Table 6 under the terms linked at https://arxiv.org/abs/2507.06920.',
  parts: {cpp: 'C++', python: 'Python'},
  aliases: {'GPT-4o (2024-11-20)': 'gpt-4o-nov-2024'},
  async fetch() {
    const t = paperTables(await paperHtml(feed)).map(grid).find(t =>
      t[0]?.join('|') === 'Model|Pass@1 on CodeCompass (C++)|Pass@1 on CodeCompass (Python)');
    if (!t) throw new Error('Missing CodeCompass Pass@1 table');
    return checked(t.slice(1).map(([model, c, p]) => {
      const cpp = numberCell(c.replace(/%$/, ''));
      const python = numberCell(p.replace(/%$/, ''));
      return {model, score: (cpp + python)/2, metrics: {cpp, python}};
    }), 7);
  },
};
export default board;
