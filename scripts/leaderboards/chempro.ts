// The source reports no overall score. The headline is the plain mean of the 8 parts, computed by this importer.
// ChemPro measures chemistry question answering. Table 8 gives multiple-choice and numerical accuracy
// for each difficulty section. Multiple-choice fractions are converted to percentages before averaging.
import type { Leaderboard } from './types.ts';
import { checked, grid, paperTables } from '../lib/boards/arxiv-span-tables.ts';
import { numberCell, paperHtml } from '../lib/boards/arxiv-throttled.ts';
const url = 'https://arxiv.org/html/2602.03108';
const levels = ['E','M','C','D'];
const parts = ['MCQ','Numerical'].flatMap(type => levels.map(level => type+' CP_'+level));
const board: Leaderboard = {
  benchmark:'chempro', static:'paper', url, feed:url,
  terms:'The authors publish Table 8 under the license listed at https://arxiv.org/abs/2602.03108.',
  parts:Object.fromEntries(parts.map(name => [name,{name}])),
  headline:'The paper reports no overall score, so this is the plain mean of eight accuracies across two question formats and four difficulty levels.',
  async fetch() {
    const table = paperTables(await paperHtml(url)).map(grid).find(t => t[0]?.join('|') === ['', '',...Array(4).fill('MCQ Accuracy'),...Array(4).fill('Numerical Accuracy (%)')].join('|'));
    const headings = levels.map(level => '\\mathcal{CP}_{'+level+'}');
    if (!table || table[1].join('|') !== ['Model','Size',...headings,...headings].join('|')) throw new Error('Missing ChemPro Table 8');
    return checked(table.slice(2).map(c => {
      if (c.length !== 10) throw new Error('Missing ChemPro parts for '+c[0]);
      const values = c.slice(2).map((cell,i) => numberCell(cell)*(i<4 ? 100:1));
      return {model:c[0], params:parseFloat(c[1]), score:values.reduce((sum,x) => sum+x,0)/parts.length,
        metrics:Object.fromEntries(parts.map((key,i) => [key,values[i]]))};
    }),7);
  },
};
export default board;
