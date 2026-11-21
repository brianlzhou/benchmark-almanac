// PitVQA evaluates visual question answering about pituitary surgery. Table 2 emphasizes balanced accuracy.
// The importer reads the PitVQA columns and converts the reported fractions to percentages.
import type { Leaderboard } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2405.13949';
const board: Leaderboard = {
  benchmark: 'pitvqa',
  static: 'paper',
  url: feed,
  feed,
  terms: PAPER_TERMS + ' https://info.arxiv.org/help/license/index.html',
  stats: { fScore: { name: 'F score', unit: '%', better: 'higher' }, accuracy: { name: 'Accuracy', unit: '%', better: 'higher' }, recall: { name: 'Recall', unit: '%', better: 'higher' } },
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const header = ["MODELS","FScore","B. Acc","Acc","Recall","FScore","B. Acc","Acc","Recall"];
    const table = tables.find(t => t[1]?.join('|') === header.join('|') && t[0]?.slice(5).join('|') === 'PitVQA|PitVQA|PitVQA|PitVQA');
    if (!table) throw new Error('Missing pitvqa results columns');
    const rows = table.slice(2).filter(cells => cells[6] !== '—').map(cells => {
      const model = cells[0].replace(' (Ours)', '');
      const numeric = (index: number) => {
        const value = cells[index];
        if (!/^-?\d+(?:\.\d+)?$/.test(value ?? '')) throw new Error('Invalid score for ' + model);
        return Number(value) * 100;
      };
      const metrics = {
        "fScore": numeric(5),
        "accuracy": numeric(7),
        "recall": numeric(8),
      };
      const score = numeric(6);
      return { model, score, metrics };
    });
    return checked(rows, 4);
  },
};
export default board;
