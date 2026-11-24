// Deep Memory Retrieval tests recall of facts from earlier conversations.
// Table 2 of the MemGPT paper reports answer accuracy and ROUGE-L recall with and without MemGPT.
// Section 3 identifies the three dated model endpoints used in these runs.
import type { Leaderboard } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2310.08560';
const endpoints: Record<string, string> = {
  'GPT-3.5 Turbo': 'gpt-3.5-turbo-1106', 'GPT-4': 'gpt-4-0613', 'GPT-4 Turbo': 'gpt-4-1106-preview',
};
const board: Leaderboard = {
  benchmark: 'deep-memory-retrieval', static: 'paper', url: feed, feed,
  terms: 'The authors publish Table 2 under the license listed at https://arxiv.org/abs/2310.08560.',
  stats: { rougeL: { name: 'ROUGE-L recall', unit: 'score', better: 'higher' } },
  aliases: { 'gpt-3.5-turbo-1106': 'gpt-3-5-turbo-nov-2023', 'gpt-4-0613': 'gpt-4-jun-2023',
    'gpt-4-1106-preview': 'gpt-4-turbo-nov-2023' },
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t =>
      t[0][0] === 'Model' && t[0][1]?.startsWith('Accuracy') && t[0][2]?.startsWith('ROUGE-L (R)'));
    if (!table) throw new Error('Missing DMR accuracy table');
    let model = '';
    return checked(table.slice(1).map(([name, accuracy, rouge]) => {
      const harness = name === '+ MemGPT' ? 'MemGPT' : undefined;
      if (!harness) model = endpoints[name];
      if (!model || !accuracy.endsWith('%')) throw new Error('DMR model or accuracy changed');
      return { model, harness, score: numberCell(accuracy.slice(0, -1)), metrics: { rougeL: numberCell(rouge) } };
    }), 6);
  },
};
export default board;
