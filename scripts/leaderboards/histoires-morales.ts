// Histoires Morales tests whether a model chooses the normative action in French stories.
// Table 17 reports the lm-evaluation-harness multiple-choice accuracy and length-normalized accuracy.
// The English columns evaluate the separate Moral Stories dataset.
import type { Leaderboard } from './types.ts';
import { checked, flatPaperTables, grid } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2501.17117';
const board: Leaderboard = {
  benchmark: 'histoires-morales', static: 'paper', url: feed, feed,
  terms: 'The authors publish the paper under the terms listed at https://arxiv.org/abs/2501.17117.',
  aliases: { 'Mistral-instruct': 'mistral-7b-instruct-v0-1', 'Mistral-base': 'mistral-7b-v0-1' },
  async fetch() {
    const t = flatPaperTables(await paperHtml(feed)).map(grid).find(t => t[0]?.join('|') === 'Model|English|English|French|French');
    if (!t || t[1].join('|') !== 'Model|Acc.|Acc.norm.|Acc.|Acc.norm.') throw new Error('Missing French multiple-choice accuracies');
    return checked(t.slice(2).map(([model, , , acc, norm]) => ({
      model, setting: 'Multiple-choice likelihood', score: numberCell(acc), metrics: { normalizedAccuracy: numberCell(norm) },
    })), 4);
  },
};
export default board;
