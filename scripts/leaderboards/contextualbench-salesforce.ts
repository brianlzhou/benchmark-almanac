// ContextualBench tests question answering with retrieved evidence.
// Table 1 reports the average percentage across seven contextual question answering tasks.
import type { Leaderboard } from './types.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2409.09916';
const tasks = ['TriviaQA', 'TruthfulQA', '2WikiHopQA', 'MuSiQue', 'NQ', 'PopQA', 'HotpotQA'];
const board: Leaderboard = {
  benchmark: 'contextualbench-salesforce',
  static: 'paper',
  url: feed,
  feed,
  terms: 'The authors publish the table under the terms listed at https://arxiv.org/abs/2409.09916.',
  aliases: { 'gemma-2-9b-it': 'gemma-2-9b', 'Llama3 8B Instruct': 'llama-3-8b', 'Llama3.1 8B Instruct': 'llama-3-1-8b' },
  parts: Object.fromEntries(tasks.map(name => [name, { name, unit: '%' as const }])),
  async fetch() {
    const header = ['Model', ...tasks, 'Average'];
    const table = paperTables(await paperHtml(feed)).map(grid)
      .find(([row]) => JSON.stringify(row) === JSON.stringify(header));
    if (!table) throw new Error('ContextualBench Table 1 columns changed');
    return checked(table.slice(1).map(row => ({
      model: row[0], score: numberCell(row[8]),
      metrics: Object.fromEntries(tasks.map((key, i) => [key, numberCell(row[i + 1])])),
    })), 10);
  },
};
export default board;
