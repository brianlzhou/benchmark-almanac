// DebugBench tests repairs to faulty programs. Section 3.1.1 reports whole-benchmark pass rates for two GPT snapshots.
// Table 6 supplies bug-type pass rates. Weighting those rounded rates by Table 2 does not reproduce the reported totals.
import type { Leaderboard } from './types.ts';
import { text } from '../lib/html.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2401.04621';
const board: Leaderboard = {
  benchmark: 'debugbench', feed, url: feed, static: 'paper',
  terms: 'The authors publish the paper and its terms at https://arxiv.org/abs/2401.04621.',
  aliases: { 'gpt-4-0613': 'gpt-4-jun-2023', 'gpt-3.5-turbo-0613': 'gpt-3-5-turbo-jun-2023' },
  parts: {}, costPer: 'run',
  async fetch() {
    const html = await paperHtml(feed);
    const overall = text(html).match(/gpt-4-0613 [^.]{0,100}?and gpt-3\.5-0613 [^.]{0,70}?\. They respectively pass ([\d.]+)% and ([\d.]+)% of the bug instances/);
    const tables = paperTables(html).map(grid);
    const types = tables.find(t => t[0][0] === 'Major Category' && t[0][1] === 'Minor Type');
    const cost = tables.find(t => t[0].join('|') === 'Process|Query Number|Token Num|Price|Model Price|Expenditure');
    if (!overall || !types || !cost || types.length !== 19) throw new Error('Missing DebugBench results');
    const rows = ['gpt-4', 'gpt-3.5'].map((label, i) => {
      const col = types[0].indexOf(label);
      const expense = cost.find(r => r[0] === 'Model Evaluation' && r[4] === (i ? 'gpt-3.5-turbo' : label));
      if (col < 0 || !expense || !expense[5].startsWith('$')) throw new Error('Model column or cost missing');
      const metrics = Object.fromEntries(types.slice(1).map(r => {
        board.parts![r[1]] = { name: r[1], group: r[0] };
        return [r[1], numberCell(r[col])];
      }));
      return { model: i ? 'gpt-3.5-turbo-0613' : 'gpt-4-0613', setting: 'Zero-shot', score: numberCell(overall[i + 1]),
        cost: numberCell(expense[5].slice(1)), metrics };
    });
    return checked(rows, 2);
  },
};
export default board;
