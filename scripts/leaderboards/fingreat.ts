// FinGREAT tests the identification of accounting relationships in financial filings.
// Table 5 reports all-edge accuracy on 483 human-reviewed passages and breaks it down by edge and category.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2610.19240';
const parts = ['Finance','Investment','Operations','Cash flow overall','Revenue','Expenses','Interest Expenses','Tax','Net income overall','OCI','Dividends','Non-cash Equity','Cash Equity','Equity overall'];
const board: Leaderboard = {
  benchmark: 'fingreat', url: feed, feed, static: 'paper',
  terms: "The authors publish the results under the terms on the paper record. https://arxiv.org/abs/2610.19240",
  parts: Object.fromEntries(parts.map(name => [name,{name,unit:'%' as const}])),
  aliases: {'Phi-4-Mini-Instruct':'phi-4-mini','Phi-3.5-Mini-Instruct':'phi-3-5-mini'},
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const table = tables.find(t => t[0]?.at(-1) === 'ALL EDGES' && t[3]?.at(-1) === 'n=483');
    const intervals = tables.find(t => t[0]?.join('|') === 'Model|Accuracy (%)|95% CI');
    if (!table || !intervals || table[1].slice(1).join('|') !== [...parts.map(k => k.endsWith('overall') ? 'Overall' : k),'Overall'].join('|')) throw new Error('Missing edge accuracy columns');
    const intervalByModel = new Map(intervals.slice(1).map(([model,,ci]) => [model.toLowerCase(), ci]));
    const rows: LeaderboardRow[] = [];
    for (const [label,...values] of table.slice(4)) {
      if (label.endsWith('baseline')) continue;
      if (values.length !== parts.length + 1) throw new Error('Incomplete edge accuracy row');
      const model = label.replace(/^\[1pt\/2pt\]\s*/, '');
      const ci = intervalByModel.get(model.toLowerCase())?.match(/^([\d.]+)[–-]([\d.]+)$/);
      if (!ci) throw new Error('Missing confidence interval for ' + model);
      rows.push({model,score:numberCell(values.at(-1)!),low:Number(ci[1]),high:Number(ci[2]),metrics:Object.fromEntries(parts.map((k,i) => [k,numberCell(values[i])]))});
    }
    return checked(rows,44);
  },
};
export default board;
