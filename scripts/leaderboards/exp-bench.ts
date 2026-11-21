// EXP-Bench tests whether agents can design, implement, execute and interpret AI research experiments.
// Table 1 ranks by the percentage of fully correct, executable experiments. Tables 6 and 9 give categories and resource use.
import type { Leaderboard } from './types.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2505.24785';
const board: Leaderboard = {
  benchmark:'exp-bench', url:'https://huggingface.co/datasets/Just-Curieous/EXP-Bench', feed, static:'paper',
  terms:'The authors publish Tables 1, 6 and 9 in https://arxiv.org/abs/2505.24785.',
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const main = tables.find(t => t[0].join('|') === 'Agent|Model|D|I|E|I·E|C|All✓|All·E✓|#E');
    const categories = tables.filter(t => t[0].join('|') === 'Category|Agent|Model|D|I|E|I·E|C|All✓|All✓·E').at(-1);
    const resources = tables.find(t => t[0].join('|') === 'Agent|Model|Avg T|Med T|Q1 T|Q3 T|Std T|Min T|Max T');
    if (!main || !categories || !resources) throw new Error('Missing EXP-Bench results tables');
    board.parts = Object.fromEntries(categories.slice(1).map(([name]) => [name,name]));
    const costStart = resources.findIndex(r => r[2] === 'Avg C');
    if (costStart < 1) throw new Error('EXP-Bench cost block missing');
    return checked(main.slice(1).map(([harness,model,...cells]) => {
      const shortAgent = harness === 'OpenHands' ? 'OH' : 'IA';
      const shortModel = model.replace(/^(Claude-|Amazon )/,'');
      const match = (r:string[]) => r[0] === shortAgent && r[1] === shortModel;
      const time = resources.slice(1,costStart).find(match);
      const cost = resources.slice(costStart+1).find(match);
      if (!time || !cost || cells.length !== 8) throw new Error('Invalid EXP-Bench row: ' + model);
      const metrics = Object.fromEntries(['Design','Implementation','Execution','Executable implementation','Conclusion','All correct','All executable','Execution checked']
        .map((name,i) => [name,numberCell(cells[i])]));
      for (const r of categories.slice(1)) {
        if (r[1] === shortAgent && r[2] === shortModel) metrics[r[0]] = numberCell(r[9]);
      }
      return {model,harness,score:metrics['All executable'],cost:numberCell(cost[2]),metrics:{...metrics,minutes:numberCell(time[2])}};
    }),7);
  },
};
export default board;
