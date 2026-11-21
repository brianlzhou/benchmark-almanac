// NEPAQuAD tests question answering about environmental impact statements. Table 5 reports the percentage
// of correct answers under four context settings.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2407.07321';
const board: Leaderboard = {
  benchmark: 'nepaquad', static: 'paper', url: feed, feed,
  terms: 'The authors publish this table under the terms listed at https://arxiv.org/abs/2407.07321.',
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const table = tables.find(t => t[0]?.join('|') === 'Context|None|PDF|RAG|Gold');
    if (!table) throw new Error('Missing NEPAQuAD context comparison');
    const names: Record<string,string> = {Claude: 'Claude 3.5 Sonnet', Gemini: 'Gemini 1.5 Pro', Mistral: 'Mistral-7B-Instruct'};
    const rows: LeaderboardRow[] = [];
    for (const [label, ...values] of table.slice(1)) {
      if (values.length !== 4) throw new Error('Missing context score');
      for (const [i,v] of values.entries()) {
        if (!v.endsWith('%')) throw new Error('Invalid answer correctness');
        rows.push({model: names[label] ?? label, setting: table[0][i+1] + ' context', score: numberCell(v.slice(0,-1))});
      }
    }
    return checked(rows, 20);
  },
};
export default board;
