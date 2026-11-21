// Bench4HLS tests generated C++ hardware designs. Designs that pass simulation proceed to synthesis.
// Table II gives pass@1, pass@5 and pass@10 for each stage. Synthesis pass@1 is the final-stage success rate.
import type { Leaderboard } from './types.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2601.19941';
const board: Leaderboard = {
  benchmark: 'bench4hls', static: 'paper', url: feed, feed,
  terms: 'The authors publish Table II under the terms on https://arxiv.org/abs/2601.19941.',
  parts: {compilation: 'Compilation pass@1', simulation: 'Simulation pass@1'},
  async fetch() {
    const table = paperTables(await paperHtml(feed)).map(grid).find(t => t[0]?.includes('Synthesis Status'));
    if (!table || [1,4,7].map(i => table[0][i]).join() !== 'Compilation Status,Simulation Status,Synthesis Status'
      || table[1].slice(1).join() !== Array(3).fill('Pass@1,Pass@5,Pass@10').join()) throw new Error('Missing Table II columns');
    const rows = table.slice(2).map(([model, ...cells]) => {
      if (cells.length !== 9 || !cells.every(v => /^\d+(?:\.\d+)?%$/.test(v))) throw new Error('Invalid pass rate');
      const [compilation, compilationPassAt5, compilationPassAt10, simulation, simulationPassAt5, simulationPassAt10, score, passAt5, passAt10] = cells.map(parseFloat);
      return {model, score, metrics: {compilation, compilationPassAt5, compilationPassAt10, simulation, simulationPassAt5, simulationPassAt10, passAt5, passAt10}};
    });
    return checked(rows, 4);
  },
};
export default board;
