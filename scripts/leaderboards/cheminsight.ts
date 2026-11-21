// ChemInsight tests reasoning across related chemistry problems. Table 1 ranks models by normalized Scope Score.
// Depth Score and the six ability scores use the authors' original scales. Each result averages eight runs.
import type { Leaderboard } from './types.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
import { paperHtml } from '../lib/boards/arxiv-throttled.ts';

const feed = 'https://arxiv.org/html/2611.11794';
const parts = { A: 'Reaction-type recognition', B: 'Structure generation in context', C: 'Calculation and counting',
  D: 'Structure-property reasoning', E: 'Selectivity prediction', F: 'Spatial imagination and three-dimensional thinking' };
const board: Leaderboard = {
  benchmark: 'cheminsight', static: 'paper', feed, url: feed, parts,
  terms: 'The authors publish Table 1 under the terms at https://arxiv.org/abs/2611.11794.',
  aliases: { 'Qwen3-235B-A22B-Thinking-2507': 'qwen3-235b-a22b-thinking-jul-2025' },
  async fetch() {
    const header = ['Model','Inference Mode','Scope Score','Depth Score',...Object.keys(parts)];
    const table = paperTables(await paperHtml(feed)).map(grid).find(t => t[0]?.join() === header.join());
    if (!table) throw new Error('Missing ChemInsight scores');
    return checked(table.slice(1).map(([model,setting,...cells]) => {
      if (cells.length !== 8 || !cells.every(v => /^\d+\.\d+$/.test(v))) throw new Error('Invalid scores for ' + model);
      const [score,depth,...abilities] = cells.map(Number);
      return {model, setting, score, trials: 8, metrics: {depth, ...Object.fromEntries(Object.keys(parts).map((key,i) => [key,abilities[i]]))}};
    }), 10);
  },
};
export default board;
