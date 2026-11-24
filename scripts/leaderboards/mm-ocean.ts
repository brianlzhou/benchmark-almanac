// MM-OCEAN tests whether models ground apparent personality ratings in video evidence.
// Table 3 ranks by holistic-grounding rate, the percentage of samples passing all three tasks.
import type { Leaderboard } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2605.22109v1';
const board: Leaderboard = {
  benchmark: 'mm-ocean', static: 'paper', url: feed, feed,
  terms: 'The benchmark authors publish their licensing terms at https://github.com/kkkcx/MM-OCEAN/blob/main/LICENSE.',
  parts: {
    t1: { name: 'Personality Rating', unit: '%' },
    t2: { name: 'Open-Ended Reasoning', unit: 'score', note: 'AI judge composite from 1 to 10.' },
    t3: { name: 'Grounding MCQs', unit: '%' },
  },
  stats: {
    mae: { name: 'Personality rating MAE', unit: 'score', better: 'lower', note: 'Mean absolute error on ordinal personality ratings.' },
    pr: { name: 'Prejudice rate', unit: '%', better: 'lower' },
    cr: { name: 'Confabulation rate', unit: '%', better: 'lower' },
    ir: { name: 'Integration failure rate', unit: '%', better: 'lower' },
    rgm: { name: 'Rating-grounding misalignment', unit: 'score', note: 'Average Task 2 and Task 3 rank minus Task 1 rank. Positive values indicate stronger rating than grounding.' },
  },
  async fetch() {
    const html = (await paperHtml(feed)).replace(/<cite\b[^>]*>[\s\S]*?<\/cite>/gi, '');
    const table = paperTables(html).map(grid).find(t => t[1]?.[6]?.startsWith('HR '));
    const headers = ['Model', 'Size', 'T1', 'MAE', 'T2', 'T3', 'HR', 'PR', 'CR', 'IR', 'RGM'];
    if (!table || !headers.every((name, i) => table[1][i]?.split(' ')[0] === name)) throw new Error('Missing Table 3 columns');
    const rows = table.slice(2).filter(r => r[0] !== r[1] && r[0] !== 'Random baseline').map(r => {
      const values = r.slice(2).map(v => /^[+-]?\d+(?:\.\d+)?$/.test(v) ? Number(v) : NaN);
      if (values.length !== 9 || !values.every(Number.isFinite)) throw new Error('Invalid Table 3 row');
      const [t1, mae, t2, t3, score, pr, cr, ir, rgm] = values;
      return { model: r[0], score, open: r[1] !== 'API', params: r[1] === 'API' ? undefined : parseFloat(r[1]),
        metrics: { t1, mae, t2, t3, pr, cr, ir, rgm } };
    });
    return checked(rows, 27);
  },
};
export default board;
