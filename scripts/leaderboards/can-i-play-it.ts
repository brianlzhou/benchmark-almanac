// CIPI tests prediction of nine piano difficulty grades. Table 2 names three classifiers by their
// input representation and also scores their ensemble. Acc-9 is balanced accuracy in percent.
// Parentheses give the standard deviation over five splits. We read only the CIPI columns.
import type { Leaderboard } from './types.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
const url = 'https://arxiv.org/html/2306.08480';
const board: Leaderboard = {
  benchmark:'can-i-play-it', static:'paper', url, feed:url,
  terms:'The authors publish Table 2 under the license at https://arxiv.org/abs/2306.08480.',
  parts:{ acc3:'Acc-3', withinOne:'Acc±1', mse:{name:'MSE',unit:'score',better:'lower'} },
  async fetch() {
    const figure = (await paperHtml(url)).match(/<figure\b[^>]*class="ltx_table"[^>]*>(?:(?!<\/figure>)[\s\S])*?Experiment comparison of all the input representations[^]*?<\/figure>/)?.[0];
    if (!figure) throw new Error('Missing Table 2');
    const [table] = paperTables(figure).map(grid);
    if (table[0].join('|') !== '|CIPI|CIPI|CIPI|CIPI|MKD' || table[1].join('|') !== '|Acc-9|Acc-3|Acc±1|MSE|Acc-3') throw new Error('CIPI result columns changed');
    return checked(table.slice(2).map(c => {
      const values = c.slice(1,5).map(cell => {
        const v = /^(\d+\.?\d*)\((\d+\.?\d*)\)$/.exec(cell);
        if (!v) throw new Error('Missing CIPI mean or standard deviation');
        return [Number(v[1]),Number(v[2])];
      });
      const [[score,std],[acc3,acc3Std],[withinOne,withinOneStd],[mse,mseStd]] = values;
      return { model:c[0], score, trials:5, metrics:{std,acc3,acc3Std,withinOne,withinOneStd,mse,mseStd} };
    }),4);
  },
};
export default board;
