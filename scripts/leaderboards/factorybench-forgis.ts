// The source reports no overall score. The headline is the plain mean of the 4 parts, computed by this importer.
// FactoryBench tests reasoning about industrial machines. The project site's headline results table
// gives zero-shot, chance-corrected accuracy on each reasoning level.
import type { Leaderboard } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://www.forgis.com/papers/factorybench.html';
const levels = ['L1 State', 'L2 Intervention', 'L3 Counterfactual', 'L4 Decision'];
const board: Leaderboard = {
  benchmark: 'factorybench-forgis', url, feed: url,
  terms: 'Forgis Labs publishes the results with attribution to the paper. https://www.forgis.com/papers/factorybench.html',
  parts: Object.fromEntries(levels.map((level, i) => ['l' + (i + 1), level])),
  async fetch() {
    const table = tables(await fetchText(url)).find(t =>
      JSON.stringify(t[0]?.map(c => c.text)) === JSON.stringify(['Model', ...levels]));
    if (!table) throw new Error('Missing FactoryBench level scores');
    const rows = table.slice(1).filter(row => row[0].text !== 'Simple baseline').map(row => {
      const cells = row.slice(1).map(c => c.text);
      if (cells.length !== 4 || !cells.every(c => /^-?\d+(?:\.\d+)?$/.test(c))) throw new Error('Invalid level score');
      const values = cells.map(Number);
      const metrics = Object.fromEntries(values.map((v, i) => ['l' + (i + 1), v]));
      return { model: row[0].text, metrics, setting: 'Zero-shot', score: values.reduce((a, b) => a + b, 0) / 4 };
    });
    checked(rows.map(row => ({ ...row })), 6);
    return rows;
  },
};
export default board;
