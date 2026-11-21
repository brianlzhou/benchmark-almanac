// The source reports no overall score. The headline is the plain mean of the 5 parts, computed by this importer.
// AutoEval measures robot policy success on physical manipulation tasks. Tables 1 and 2 report successes
// out of 50 attempts per task, as judged by AutoEval and by human evaluators respectively.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2503.24278';
const tasks = ['Open Drawer', 'Close Drawer', 'To Basket', 'To Sink', 'Fold Cloth'];
const board: Leaderboard = {
  benchmark: 'autoeval', url: feed, feed, static: 'paper',
  terms: 'Results credited to the authors. https://arxiv.org/abs/2503.24278',
  headline: 'The headline averages success rates across the five Bridge-AutoEval tasks.',
  parts: Object.fromEntries(tasks.map(name => [name, { name, unit: '%' }])),
  async fetch() {
    const html = await paperHtml(feed);
    const rows: LeaderboardRow[] = [];
    for (const [id, setting] of [['A3.T1','AutoEval scoring'], ['A3.T2','Human scoring']]) {
      const figure = html.split('<figure id="' + id + '"')[1]?.split('</figure>')[0];
      if (!figure) throw new Error('Missing evaluation table ' + id);
      const table = grid(flatPaperTables(figure)[0]);
      if (table[0][0] !== 'Policy' || tasks.some((name,i) => name !== table[1][i+1] + ' ' + table[2][i+1])) throw new Error('Changed task columns');
      for (const [label, ...cells] of table.slice(3)) {
        if (cells.length !== 5 || !cells.every(cell => /^\d+\/50$/.test(cell))) throw new Error('Incomplete policy row: ' + label);
        const rates = cells.map(cell => 2 * Number(cell.split('/')[0]));
        rows.push({ model: label.replace('\\pi_{0}', 'π₀'), setting, trials: 250,
          score: rates.reduce((sum,v) => sum + v, 0) / tasks.length,
          metrics: Object.fromEntries(tasks.map((name,i) => [name,rates[i]])) });
      }
    }
    return checked(rows, 12);
  },
};
export default board;
