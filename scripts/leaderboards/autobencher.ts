// The source reports no overall score. The headline is the plain mean of the 3 parts, computed by this importer.
// Table 11 reports accuracy on generated history, economy and science questions. This covers the knowledge evaluation.
import type { Leaderboard } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2407.08351';
const subjects = ['History','Economy','Science'];
export default {
  benchmark: 'autobencher', url: feed, feed, static: 'paper',
  terms: 'The authors link the paper license at https://arxiv.org/abs/2407.08351',
  headline: 'The headline is the plain mean of the three generated knowledge tests in Table 11. The paper gives no accuracy across all AutoBencher evaluations.',
  parts: Object.fromEntries(subjects.map(k => [k,k])),
  async fetch() {
    const t = paperTables(await paperHtml(feed)).map(grid).find(t => t[1]?.join('|') === 'Models|AutoBench|MMLU|AutoBench|MMLU|AutoBench|MMLU');
    if (!t || t[0].join('|') !== '|History|History|Economy|Economy|Science|Science') throw new Error('Missing Table 11');
    return checked(t.slice(2).map(c => {
      const values = subjects.map((_,i) => 100*numberCell(c[2*i+1]));
      return { model: c[0], score: values.reduce((a,b) => a+b)/3,
        metrics: Object.fromEntries(subjects.map((k,i) => [k,values[i]])) };
    }),17);
  },
} satisfies Leaderboard;
