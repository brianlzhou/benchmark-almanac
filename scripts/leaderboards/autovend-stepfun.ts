// AutoVend tests agents that operate vending machines over multiple days.
// Table 2 ranks models by mean final net assets in thousands of yuan across three runs.
import type { Leaderboard } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, flatPaperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2610.36980';
const keys = ['std','Assortment','Waste Rate','Pricing Regret','Shelf Utilization','Tool Calls','API Efficiency'];
export default {
  benchmark: 'autovend-stepfun', url: feed, feed, static: 'paper',
  terms: 'The paper and license are linked at https://arxiv.org/abs/2610.36980',
  headline: 'The score is mean final net assets, in thousands of yuan, over three runs.',
  async fetch() {
    const t = flatPaperTables(await paperHtml(feed)).map(grid).find(t => t[0]?.[1]?.startsWith('Net Assets'));
    const expected = ['Model','Net Assets','Std',...keys.slice(1)];
    if (!t || t[0].map(c => c.replace(/ [↑↓].*$/,'')).join('|') !== expected.join('|')) throw new Error('Missing AutoVend Table 2');
    return checked(t.slice(1).filter(r => r[0] !== 'Rule-based').map(([model,score,...cells]) => ({
      model, score: numberCell(score), trials: 3,
      metrics: Object.fromEntries(keys.map((k,i) => [k,numberCell(cells[i].replaceAll(',',''))])),
    })),5);
  },
} satisfies Leaderboard;
