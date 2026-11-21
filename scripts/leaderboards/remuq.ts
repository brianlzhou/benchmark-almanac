// ReMuQ tests retrieval of a passage from an image and a question. Tables 2 and 3 give zero-shot and fine-tuned results.
// The headline follows their MRR@5 column. Table 6 reverses the first two values for the fine-tuned ReViz+VL-ICT run.
import type { Leaderboard } from './types.ts';
import { paperHtml, PAPER_TERMS } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2306.00424';
const board: Leaderboard = {
  benchmark: 'remuq',
  static: 'paper',
  url: feed,
  feed,
  terms: PAPER_TERMS + ' https://info.arxiv.org/help/license/index.html',
  stats: { precisionAt1: { name: 'Precision at 1', unit: '%', better: 'higher' }, recallAt5: { name: 'Recall at 5', unit: '%', better: 'higher' }, recallAt10: { name: 'Recall at 10', unit: '%', better: 'higher' }, recallAt20: { name: 'Recall at 20', unit: '%', better: 'higher' }, recallAt50: { name: 'Recall at 50', unit: '%', better: 'higher' }, recallAt100: { name: 'Recall at 100', unit: '%', better: 'higher' } },
  async fetch() {
    const tables = paperTables(await paperHtml(feed)).map(grid);
    const header = 'Model|Dataset|KB-Size|MRR@5|P@5|R@5|R@10|R@20|R@50|R@100';
    const scores = tables.filter(t => t[1]?.join('|') === header);
    const zeroShot = scores.find(t => t.some(row => row[0] === 'DPR (GenCap)'));
    const fineTuned = scores.find(t => t.some(row => row[0] === 'ReViz'));
    if (!zeroShot || !fineTuned) throw new Error('Missing ReMuQ retrieval tables');
    const rows = [zeroShot, fineTuned].flatMap((table, i) =>
      table.filter(row => row[1] === 'ReMuQ' && row[2] === '199K').map(row => {
        const cells = row.slice(3);
        if (cells.length !== 7 || !cells.every(v => /^\d+\.\d+$/.test(v))) throw new Error('Invalid ReMuQ metrics');
        const [score, precisionAt1, recallAt5, recallAt10, recallAt20, recallAt50, recallAt100] = cells.map(Number);
        return { model: row[0], setting: i === 0 ? 'Zero-shot' : 'Fine-tuned', score,
          metrics: { precisionAt1, recallAt5, recallAt10, recallAt20, recallAt50, recallAt100 } };
      }));
    return checked(rows, 6);
  },
};
export default board;
