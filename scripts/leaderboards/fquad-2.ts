// FQuAD 2.0 tests French reading comprehension with answerable and unanswerable questions.
// Tables 3 and 5 report overall development-set F1. Table 3 adds precision and recall for detecting unanswerable questions.
import type { Leaderboard } from './types.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2109.13209';
const board: Leaderboard = {
  benchmark: 'fquad-2', static: 'paper', url: feed, feed,
  terms: 'The authors publish this paper under the terms listed at https://arxiv.org/abs/2109.13209.',
  parts: { hasAnswerF1: 'F1 has ans' },
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const baseline = tables.find(t => t[0].join('|') === 'Model|Dataset|EM|F1|F1 has ans|NoAns F1|NoAns P|NoAns R');
    const multi = tables.find(t => t[0].join('|') === 'Model|Training Dataset|Test Dataset|EM|F1|F1 has ans|NoAns F1');
    if (!baseline || !multi) throw new Error('Missing FQuAD 2.0 results');
    return checked(multi.slice(1).filter(r => r[2] === 'FQuAD2.0').map(([model, train, , em, f1, has, no]) => {
      const b = baseline.find(r => r[0] === model && r[1] === train);
      const metrics: Record<string, number> = { exactMatch: numberCell(em), hasAnswerF1: numberCell(has), noAnswerF1: numberCell(no) };
      if (b) {
        if (b[3] !== f1) throw new Error('FQuAD tables disagree');
        metrics.noAnswerPrecision = numberCell(b[6]);
        metrics.noAnswerRecall = numberCell(b[7]);
      }
      return { model, setting: 'Trained on ' + train, score: numberCell(f1), metrics };
    }), 6);
  },
};
export default board;
