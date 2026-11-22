// ARE-bench measures strict instance success rate on research tasks in real workspaces.
// The headline is the paper's overall ISR percentage from Table 5, with CSR and sample deviation in metrics.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
const URL = 'https://arxiv.org/html/2611.14364';
const board: Leaderboard = { benchmark: 'are-bench', static: 'paper', url: URL, feed: URL, terms: PAPER_TERMS,
  harnesses: 'system',
  stats: { csr: { name: 'Compound success rate', unit: '%', better: 'higher' } },
  async fetch() {
    const tables = paperTables(await paperHtml(URL)).map(grid);
    const actors = tables.find(t => t[0]?.join('|') === 'Evaluated model|Archived model identifier|Actor harness');
    if (!actors) throw new Error('ARE-bench actor harness table missing');
    const harnessByModel = new Map(actors.slice(1).map(([model, , harness]) => [model, harness.trim()]));
    const table = tables.find(t => t.some(r => r.some(c => c.includes('Overall ISR'))));
    if (!table) throw new Error('ARE-bench Table 5 missing');
    const out: LeaderboardRow[] = [];
    for (const row of table.slice(1)) {
      const model = row[0];
      const a = row[1]?.match(/(\d+\.\d+)\s*\\?pm\s*(\d+\.\d+)/);
      const b = row[2]?.match(/(\d+\.\d+)\s*\\?pm\s*(\d+\.\d+)/);
      if (!model || !a || !b) continue;
      out.push({ model, harness: harnessByModel.get(model), score: Number(a[1]), high: Number(a[1]) + Number(a[2]), low: Number(a[1]) - Number(a[2]), metrics: { csr: Number(b[1]), csrStd: Number(b[2]), isrStd: Number(a[2]) } });
    }
    return checked(out, 7);
  },
};
export default board;
