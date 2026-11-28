// mRobust04 tests document retrieval in nine languages. Table 2 reports average
// nDCG@20 and per-language scores, with nDCG prime and recall as secondary measures.
import type { Leaderboard } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2209.13738';
const board: Leaderboard = {
  benchmark: 'mrobust04', url: feed, feed, static: 'paper',
  terms: 'Paper and license details at https://arxiv.org/abs/2209.13738.',
  stats: Object.fromEntries([
    ...Object.entries({en:'English',fr:'French',pt:'Portuguese',it:'Italian',id:'Indonesian',ru:'Russian',es:'Spanish',de:'German',zh:'Chinese'}).flatMap(([lang,name]) => [
      ['ndcgPrime_'+lang, {name: name + ' nDCG prime',unit:'score' as const,better:'higher' as const}],
      ['recall1000_'+lang, {name: name + ' Recall@1000',unit:'score' as const,better:'higher' as const}],
    ]),
    ['ndcgPrime',{name:'Average nDCG prime',unit:'score' as const,better:'higher' as const}],
    ['recall1000',{name:'Average Recall@1000',unit:'score' as const,better:'higher' as const}],
  ]),
  parts: { en: 'English', fr: 'French', pt: 'Portuguese', it: 'Italian', id: 'Indonesian',
    ru: 'Russian', es: 'Spanish', de: 'German', zh: 'Chinese' },
  async fetch() {
    const html = (await paperHtml(feed)).replace(/<cite\b[^>]*>[\s\S]*?<\/cite>/gi, '');
    const tables = paperTables(html).map(grid);
    const table = tables.find(t => t[0].join() === ',en,fr,pt,it,id,ru,es,de,zh,avg');
    if (!table || table[1][0] !== 'nDCG@20' || !table.some(r => r[0] === 'nDCG’@20') ||
        !table.some(r => r[0] === 'R@1000')) throw new Error('Missing multilingual retrieval scores');
    const rows = new Map<string, { model: string, score: number, metrics: Record<string, number> }>();
    let measure = '';
    for (const r of table.slice(1)) {
      if (r[0] === r[1]) { measure = r[0]; continue; }
      const model = r[0];
      if (measure === 'nDCG@20') rows.set(model, { model, score: numberCell(r[10]), metrics: {} });
      const row = rows.get(model);
      if (!row) throw new Error('Missing primary result for ' + model);
      const prefix = measure === 'nDCG@20' ? '' : measure === 'nDCG’@20' ? 'ndcgPrime_' : 'recall1000_';
      table[0].slice(1, 10).forEach((key, i) => { row.metrics[prefix + key] = numberCell(r[i + 1]); });
      if (prefix) row.metrics[prefix.slice(0, -1)] = numberCell(r[10]);
    }
    return checked([...rows.values()], 3);
  },
};
export default board;
