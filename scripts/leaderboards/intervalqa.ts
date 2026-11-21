// IntervalQA tests language models on true or false, multiple-choice, and numerical forecasts.
// The headline score is the paper's Average column across those three question types.
// This importer reads Table 2 of the benchmark paper.
import type { Leaderboard } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
const URL = 'https://arxiv.org/html/2206.15474';
const board: Leaderboard = {
  benchmark: 'intervalqa', static: 'paper', url: URL, feed: URL,
  terms: 'The benchmark paper is available under the arXiv terms of use. https://arxiv.org/abs/2206.15474',
  parts: { tf: { name: 'T/F', group: 'Question type' }, mcq: { name: 'MCQ', group: 'Question type' }, numerical: { name: 'Numerical', group: 'Question type' } },
  async fetch() {
    const tables = paperTables(await paperHtml(URL)).map(grid);
    const table = tables.find((t) => t[0]?.join('|') === 'Model|Parameters|T/F|MCQ|Numerical|Score|Average');
    if (!table) throw new Error('IntervalQA Table 2 missing');
    const rows = table.slice(1).filter((r) => r[0] && !['Random', 'Human Crowd'].includes(r[0]));
    const out = rows.map((r) => ({ model: `${r[0]} ${r[1]}`.trim(), score: Number(r[6]), setting: 'paper Table 2', metrics: { tf: Number(r[2]), mcq: Number(r[3]), numerical: Number(r[4]) } }));
    return checked(out, 10);
  },
};
export default board;
