// Natural Plan tests language models on trip planning, meeting planning, and calendar scheduling.
// The source reports no overall score. The headline is the plain mean of the three task scores.
// This importer reads Table 2 of the benchmark paper.
import type { Leaderboard } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
const URL = 'https://arxiv.org/html/2406.04520';
const board: Leaderboard = {
  benchmark: 'natural-plan', static: 'paper', url: URL, feed: URL,
  terms: 'The benchmark paper is available under the arXiv terms of use. https://arxiv.org/abs/2406.04520',
  headline: 'The paper reports no overall score, so this is the plain mean of its three planning task scores.',
  parts: { trip: { name: 'Trip Planning', group: 'Task' }, meeting: { name: 'Meeting Planning', group: 'Task' }, calendar: { name: 'Calendar Scheduling', group: 'Task' } },
  async fetch() {
    const tables = paperTables(await paperHtml(URL)).map(grid);
    const table = tables.find((t) => t[0]?.join('|') === 'Task|GPT-3.5|GPT-4|GPT-4o|Gemini 1.5 Flash|Gemini 1.5 Pro');
    if (!table) throw new Error('Natural Plan Table 2 missing');
    const rows = table.slice(1);
    const names = table[0].slice(1);
    const values = names.map((model, i) => {
      const trip = Number(rows[0][i + 1].replace('%', ''));
      const meeting = Number(rows[1][i + 1].replace('%', ''));
      const calendar = Number(rows[2][i + 1].replace('%', ''));
      return { model, score: (trip + meeting + calendar) / 3, setting: '5-shot', metrics: { trip, meeting, calendar } , flag: undefined };
    });
    return checked(values, 5);
  },
};
export default board;
