// RefChecker tests factual consistency of claim triplets. Table 8 gives the authors’
// average checker accuracy across three contexts and provides accuracy and macro F1 for each.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2405.14486';
const board: Leaderboard = {
  benchmark: 'refchecker',
  url: feed,
  feed,
  static: 'paper',
  terms: 'The authors publish these results under the terms linked at https://arxiv.org/abs/2405.14486.',
  parts: { zero: 'Zero-context (NQ)', noisy: 'Noisy-context (MS MARCO)', accurate: 'Accurate-context (databricks-dolly-15k)' },
  stats: { macroF1: {name: 'Macro F1', unit: '%'}, zeroF1: {name: 'Zero-context macro F1', unit: '%'},
    noisyF1: {name: 'Noisy-context macro F1', unit: '%'}, accurateF1: {name: 'Accurate-context macro F1', unit: '%'} },
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const table = tables.find(table => table[0][1] === 'Average of three settings' && table[1].join('|') === 'Models|Accuracy|Macro-F1|Accuracy|Macro-F1|Accuracy|Macro-F1|Accuracy|Macro-F1' && table.some(r => r[0] === '3-shot'));
    if (!table) throw new Error('Missing reviewed results columns');
    const rows: LeaderboardRow[] = [];
    for (const cells of table.slice(2)) {
      const [label, ...values] = cells;
      if (!label) continue;
      if (values.length !== 8) throw new Error('Missing checker results for ' + label);
      const [score, macroF1, zero, zeroF1, noisy, noisyF1, accurate, accurateF1] = values.map(numberCell);
      const prompt = /^(zero|1|3)-shot$/.test(label);
      const variant = /^(LoRA|RepC)-/.test(label);
      rows.push({ model: prompt ? 'Mistral' : variant ? 'Mistral ' + label : label, ...(prompt ? { setting: label } : {}),
        score, metrics: { macroF1, zero, zeroF1, noisy, noisyF1, accurate, accurateF1 } });
    }
    return checked(rows, 15);
  },
};
export default board;
