// Assembly101-O tests online detection of procedural mistakes in toy assembly videos.
// Table 2 reports precision, recall and F1 on this dataset. Oracle recognition uses ground truth and is excluded.
import type { Leaderboard } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2404.01933';
const board: Leaderboard = {
  benchmark: 'assembly101-o', static: 'paper', url: feed, feed,
  terms: 'The CVPR authors publish the table on arXiv. https://arxiv.org/abs/2404.01933',
  async fetch() {
    const t = paperTables(await paperHtml(feed)).map(grid).find(t => t[0][3] === 'Assembly101-O' && t[0][6] === 'Epic-tent-O');
    if (!t || t[1].slice(3, 6).join() !== 'Precision,Recall,F1 score') throw new Error('Missing Assembly101-O results');
    const rows = t.slice(2).filter(r => r[1] !== 'Oracle').map(([method, recognition, anticipation, p, r, f]) => {
      const clean = (s: string) => s.replace(/\s*\[\s*\d+\s*\]/g, '').trim();
      if (![p, r, f].every(v => /^\d+(\.\d+)?$/.test(v))) throw new Error('Invalid Assembly101-O score');
      return { model: clean(anticipation), harness: method === 'PREGO' ? 'PREGO with ' + clean(recognition) : clean(method),
        score: Number(f), metrics: { precision: Number(p), recall: Number(r) } };
    });
    return checked(rows, 4);
  },
};
export default board;
