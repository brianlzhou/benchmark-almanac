// RMS-AQA tests two-stage reasoning about spatial audio. The official ranking counts both answers as correct together.
// Table 1 in the authors' README gives overall and category-level validation results, including separately adapted models.
import type { Leaderboard, BoardPart } from './types.ts';
import { fetchText } from '../lib/util.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://raw.githubusercontent.com/rmsaqachallenge/rmsaqa-code/HEAD/README.md';
const categories = ['SC', 'SL', 'TD', 'SR', 'TR', 'AP'];
const parts: Record<string, BoardPart> = {};
for (const category of categories) {
  parts['raw' + category] = { name: category, group: 'Raw Stage 2' };
  parts['grounded' + category] = { name: category, group: 'Grounded Stage 2' };
}
export default {
  benchmark: 'rms-aqa', url: 'https://rmsaqachallenge.github.io/', feed, parts,
  terms: 'The challenge authors publish Table 1 in their public repository. https://github.com/rmsaqachallenge/rmsaqa-code#results',
  async fetch() {
    const table = paperTables(await fetchText(feed)).map(grid).find(t => t[0]?.[0] === 'System' && t[0]?.[10]?.startsWith('Grounded Stage-2'));
    if (!table || table[1].slice(4).join('|') !== [...categories, ...categories].join('|') || table[1][3] !== 'A GS2') throw new Error('Missing grounded accuracy columns');
    let backbone = '';
    return checked(table.slice(2).map(([name, ...cells]) => {
      if (cells.length !== 15 || cells.some(s => !/^\d+(\.\d+)?$/.test(s))) throw new Error('Incomplete validation scores');
      if (!name.startsWith('+')) backbone = name;
      if (!backbone) throw new Error('Spatial adapter has no backbone');
      const model = name.startsWith('+') ? backbone + ' ' + name : name;
      const values = cells.map(Number);
      const keys = ['stage1', 'rawStage2', 'groundedStage2', ...categories.map(k => 'raw' + k), ...categories.map(k => 'grounded' + k)];
      return { model, score: values[2], metrics: Object.fromEntries(keys.map((k,i) => [k, values[i]])) };
    }), 11);
  },
} satisfies Leaderboard;
