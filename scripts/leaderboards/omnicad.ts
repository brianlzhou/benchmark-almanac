// OmniCAD evaluates how well models identify and assemble CAD components.
// The direct and agent tables give ID-NR accuracy for component identification.
import { fetchText } from '../lib/util.ts';
import { tables } from '../lib/html.ts';
import { checked, grid } from '../lib/boards/arxiv-span-tables.ts';
import type { Leaderboard, LeaderboardRow } from './types.ts';

const feed = 'https://www.omnieda.com/omnicad/';
const metrics = ['ID-NR ↑', 'ID-R ↑', 'Pos@10 ↑', 'Rot@10 ↑', 'CDᵢ ↓', 'PA ↑',
  'PairF1 ↑', 'TypeAcc ↑', 'GSim ↑', 'C-Free ↑', 'SCD ↓', 'PosErr ↓'];
export default {
  benchmark: 'omnicad', url: feed + '#direct-results', feed,
  terms: 'Public results published by the authors at ' + feed,
  headline: 'The tables report no overall score. The headline is ID-NR, their first accuracy measure.',
  stats: {
    'ID-NR': { name: 'Identification without retrieval accuracy', unit: '%', better: 'higher' }, 'ID-R': { name: 'ID-R accuracy', unit: '%', better: 'higher' }, 'Pos@10': { name: 'Position at 10 accuracy', unit: '%', better: 'higher' }, 'Rot@10': { name: 'Rotation at 10 accuracy', unit: '%', better: 'higher' }, CDᵢ: { name: 'Chamfer distance', better: 'lower' }, PA: { name: 'Part accuracy', unit: '%', better: 'higher' }, PairF1: { name: 'Pair F1', unit: '%', better: 'higher' }, TypeAcc: { name: 'Type accuracy', unit: '%', better: 'higher' }, GSim: { name: 'Geometric similarity', unit: '%', better: 'higher' }, 'C-Free': { name: 'Constraint-free score', unit: '%', better: 'higher' }, SCD: { name: 'Shape consistency distance', better: 'lower' }, PosErr: { name: 'Position error', better: 'lower' }, RT: { name: 'Runtime', unit: 'seconds', better: 'lower' }, PR: { name: 'Precision-recall score', unit: '%', better: 'higher' }, steps: { name: 'Steps', unit: 'count', better: 'lower' },
  },
  aliases: { 'LLaMA4 Maverick': 'llama-4-maverick' },
  async fetch() {
    const grids = tables(await fetchText(feed)).map(grid);
    const rows: LeaderboardRow[] = [];
    for (const mode of ['Input', 'Feedback']) {
      const table = grids.find(t => t[0][2] === mode);
      const expected = ['Model', 'Size', mode, ...metrics, ...(mode === 'Feedback' ? ['Step ↓'] : []), 'RT ↓', 'PR ↑'];
      if (!table || JSON.stringify(table[0]) !== JSON.stringify(expected)) throw new Error('Missing OmniCAD columns for ' + mode);
      for (const [model, size, setting, ...cells] of table.slice(1)) {
        if (cells.length !== expected.length - 3) throw new Error('Incomplete OmniCAD row');
        if (cells[0] === '--') continue;
        const values: Record<string, number> = {};
        for (const [i, cell] of cells.entries()) {
          if (cell === '--') continue;
          if (!/^\d+(?:\.\d+)?$/.test(cell)) throw new Error('Unexpected OmniCAD value ' + cell);
          const key = expected[i + 3].split(' ')[0];
          values[key === 'Step' ? 'steps' : key] = Number(cell);
        }
        rows.push({ model, setting, harness: mode === 'Feedback' ? 'Agent' : 'Direct',
          score: values['ID-NR'], metrics: values, ...(/^\d+(\.\d+)?B$/.test(size) ? { params: parseFloat(size) } : {}) });
      }
    }
    return checked(rows, 45);
  },
} satisfies Leaderboard;
