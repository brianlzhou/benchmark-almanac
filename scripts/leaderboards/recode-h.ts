// RECODE-H tests whether models can implement research code with feedback over ten interaction rounds.
// Table 2 reports the fraction of test cases that pass, plus recall, reciprocal rank and code similarity.
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import type { Leaderboard } from './types.ts';
const feed = 'https://arxiv.org/html/2510.06186';
const board: Leaderboard = {
  benchmark: 'recode-h', static: 'paper', url: feed, feed,
  terms: 'The authors publish Table 2 under the terms linked at https://arxiv.org/abs/2510.06186.',
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t => t[1]?.join('|') === 'Model|Feedback Level|MRR|Recall|Test Case|CodeBLEU|CodeBERT');
    if (!table) throw new Error('Missing Table 2 metrics');
    return checked(table.slice(2).filter(r => new Set(r).size > 1).map(([model, level, ...cells]) => {
      if (!/^Level [0-4]$/.test(level) || cells.length !== 5) throw new Error('Invalid feedback configuration');
      const [mrr, recall, pass, codeBLEU, codeBERT] = cells.map(c => numberCell(c.split('(')[0].trim()));
      return {model, setting: 'Feedback ' + level, harness: 'ReCodeAgent', score: pass * 100,
        metrics: {mrr, recall: recall * 100, codeBLEU, codeBERT}};
    }), 35);
  },
};
export default board;
