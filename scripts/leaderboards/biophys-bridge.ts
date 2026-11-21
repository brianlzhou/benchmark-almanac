// BioPhys-Bridge tests whether models cite evidence for biophysical reasoning.
// Table 7 ranks models by evidence-ID F1 across 154 held-out tasks. Table 8 gives scores by task type.
import type { Leaderboard } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2609.19180';
const board: Leaderboard = {
  benchmark: 'biophys-bridge', static: 'paper', feed, url: feed,
  terms: 'The authors release reports under CC BY 4.0. https://github.com/qyxu1994/BioPhys-Bridge#license',
  parts: { derivation: 'Derivation', discrepancy: 'Discrepancy', mechanism: 'Mechanism', 'next experiment': 'Next experiment' },
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const main = tables.find(t => t[0]?.join('|') === 'Model|Provider|Evidence-ID F1|Answer token F1|Empty EID outputs');
    const tasks = tables.find(t => t[0]?.join('|') === 'Task type|N|Lex.|Flash|Qwen|GPT-mini');
    if (!main || tasks?.length !== 5) throw new Error('Missing held-out results');
    const taskColumns: Record<string, number> = { 'DeepSeek v4 Flash': 3, 'Qwen 3.7 Max': 4, 'GPT-4o-mini': 5 };
    function interval(cell: string) {
      const m = cell.match(/^(\d+\.\d+) \[(\d+\.\d+), (\d+\.\d+)\]$/);
      if (!m) throw new Error('Missing F1 confidence interval');
      return m.slice(1).map(Number);
    }
    return checked(main.slice(1).filter(c => c[1] !== 'deterministic').map(([model, provider, eid, answer, empty]) => {
      const [score, low, high] = interval(eid);
      const [answerTokenF1, answerLow, answerHigh] = interval(answer);
      const counts = empty.match(/^(\d+)\/154$/);
      if (!counts) throw new Error('Unexpected task count');
      const metrics: Record<string, number> = { answerTokenF1, answerLow, answerHigh, emptyEID: Number(counts[1]) };
      const column = taskColumns[model];
      if (column) for (const row of tasks.slice(1)) metrics[row[0]] = numberCell(row[column]);
      return { model, score, low, high, setting: 'No scaffold, ' + provider, metrics };
    }), 7);
  },
};
export default board;
