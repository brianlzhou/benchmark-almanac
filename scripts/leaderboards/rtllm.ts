// RTLLM tests whether generated Verilog implements a design description.
// Table III counts designs with at least one functional solution in five attempts.
// The paper evaluates 30 designs in v1.0 and also reports syntax correctness.
import type { Leaderboard } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const url = 'https://arxiv.org/html/2308.05345';
export default {
  benchmark: 'rtllm', url, feed: url, static: 'paper',
  terms: 'The authors publish Table III on arXiv. https://arxiv.org/abs/2308.05345',
  parts: Object.fromEntries([{ key: 'syntax', name: 'Syntax correctness', unit: '%' }].map(({ key, ...part }) => [key, part])),
  async fetch() {
    const table = paperTables(await paperHtml(url)).map(grid).find(t =>
      t[0]?.[0] === 'Design' && t[1]?.includes('Func.') && t.at(-1)?.[0] === 'Success rate');
    if (!table) throw new Error('Missing RTLLM correctness table');
    const totals = table.at(-1)!;
    const rows = [];
    for (let col = 1; col < table[0].length; col += 2) {
      const name = table[0][col].replace(/\s*\[.*?\]/g, '');
      const model = name.replace(' + SP', '').replace('GPT-4.0', 'GPT-4');
      const syntax = /^(\d+)%$/.exec(totals[col]);
      const func = /^(\d+)\/(\d+)$/.exec(totals[col + 1]);
      if (table[1][col] !== 'Syntax' || table[1][col + 1] !== 'Func.' || !syntax || !func)
        throw new Error('Unexpected correctness columns for ' + name);
      rows.push({ model, setting: name.endsWith(' + SP') ? 'Self-planning' : undefined,
        score: 100 * Number(func[1]) / Number(func[2]), trials: 5, metrics: { syntax: Number(syntax[1]) } });
    }
    return checked(rows, 6);
  },
} satisfies Leaderboard;
