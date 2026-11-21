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
  stats: {
    Assortment: { name: 'Assortment quality', unit: 'score', better: 'higher', note: 'Expected gross profit compared with a heuristic reference mix under common conditions, from 0 to 1.' },
    'Waste Rate': { name: 'Waste rate', unit: '%', better: 'lower', note: 'Inventory loss divided by valid sales cost plus loss, including expiry and early disposal.' },
    'Pricing Regret': { name: 'Pricing regret', unit: 'cny', better: 'lower', note: 'Expected gross-profit shortfall in CNY per machine per day from a price-search reference.' },
    'Shelf Utilization': { name: 'Shelf utilization', unit: '%', better: 'higher', note: 'Mean fraction of capacity occupied by unexpired stock before sales across sites and days.' },
    'Tool Calls': { name: 'Tool calls', unit: 'count' },
    'API Efficiency': { name: 'API efficiency', unit: 'cny', better: 'higher', note: 'Net-asset growth in CNY per US dollar of estimated API cost.' },
  },
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
