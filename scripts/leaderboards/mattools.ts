// The source reports no overall score. The headline is the plain mean of the code and documentation QA parts.
// MatTools tests materials science software tool use. Table 1 in the paper reports accuracy for both parts.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2505.10852';
const board: Leaderboard = {
  benchmark: 'mattools', static: 'paper', url: feed, feed,
  terms: 'The authors publish these results at https://arxiv.org/abs/2505.10852.',
  headline: 'The paper reports no overall score, so this is the plain mean of code and documentation QA accuracy.',
  parts: { code: 'Code QA accuracy', doc: 'Documentation QA accuracy' },
  async fetch() {
    const table = grid(paperTables(await paperHtml(feed))[0]);
    if (table[1]?.join('|') !== 'Model|Code|Doc') throw new Error('MatTools Table 1 columns missing');
    const rows: LeaderboardRow[] = [];
    for (const [model, code, doc] of table.slice(3)) {
      if (!model || !code || !doc || model.endsWith('LLMs')) continue;
      const values = [Number(code), Number(doc)];
      if (!values.every(Number.isFinite)) throw new Error('Invalid MatTools score');
      rows.push({ model, score: (values[0] + values[1]) / 2, metrics: { code: values[0], doc: values[1] } });
    }
    return checked(rows, 9);
  },
};
export default board;
