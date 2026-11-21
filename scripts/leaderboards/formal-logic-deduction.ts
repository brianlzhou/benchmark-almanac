// Formal Logic Deduction tests proof construction from premises. Table 4 evaluates the version 2 corpora.
// The headline is proof accuracy on FLD. The separate FLD-star corpus uses more complex formulas.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2308.07336';

const board: Leaderboard = {
  benchmark: 'formal-logic-deduction', url: feed, feed, static: 'paper',
  terms: "The authors publish the results under the terms on the paper record. https://arxiv.org/abs/2308.07336",
  parts: {answer:{name:'FLD answer accuracy',unit:'%'},starProof:{name:'FLD-star proof accuracy',unit:'%'},starAnswer:{name:'FLD-star answer accuracy',unit:'%'}},
  async fetch() {
    const tables = flatPaperTables(await paperHtml(feed)).map(grid);
    const table = tables.find(t => t[0]?.[1] === 'proof accuracy' && t[0]?.[4] === 'answer accuracy');
    if (!table || table[1][1] !== 'FLD' || table[1][4] !== 'FLD' || !table[1][2].includes('star') || table[1][2] !== table[1][5]) throw new Error('Missing Table 4 columns');
    const rows: LeaderboardRow[] = table.slice(2).filter(r => r[0] !== 'random guess').map(([name,proof,starProof,,answer,starAnswer]) => {
      const trained = name === 'T5(fine-tuned)';
      return {model:trained ? 'T5-base' : name,setting:trained ? 'Fine-tuned' : '10-shot chain of thought',score:numberCell(proof),
        metrics:{answer:numberCell(answer),starProof:numberCell(starProof),starAnswer:numberCell(starAnswer)}};
    });
    return checked(rows,4);
  },
};
export default board;
