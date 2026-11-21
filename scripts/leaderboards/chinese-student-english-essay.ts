// CSEE tests automated grading of English essays written by Chinese students. Table 2 reports
// quadratic weighted kappa against teacher grades for the overall score and three rubric dimensions.
import type { Leaderboard } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { flatPaperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2401.06431';
const parts = ['Content','Language','Structure'];
const board: Leaderboard = {
  benchmark: 'chinese-student-english-essay', url: feed, feed, static: 'paper',
  terms: 'Results credited to Changrong Xiao and colleagues. https://doi.org/10.1145/3706468.3706507',
  parts: Object.fromEntries(parts.map(name => [name,{name,unit:'score',note:'Quadratic weighted kappa'}])),
  async fetch() {
    const t = flatPaperTables(await paperHtml(feed)).map(grid).find(t => t[0]?.join('|') === ['', 'E.', 'Overall', ...parts].join('|'));
    if (!t) throw new Error('Missing CSEE results table');
    return checked(t.slice(1).map(([label,explanation,overall,...cells]) => {
      let [model,...conditions] = label.split(', ');
      if (['Ours','Fast module','Slow module'].includes(label)) {
        model = 'Fine-tuned LLaMA3-8B';
        conditions = [label === 'Ours' ? 'Fast and slow modules' : label];
      } else if (model === 'Fine-tuned LLaMA3') {
        model = 'Fine-tuned LLaMA3-8B';
        conditions = ['Score-only training'];
      }
      if (cells.length !== 3 || !['✓','✗'].includes(explanation)) throw new Error('Changed CSEE columns for ' + label);
      return { model, setting: conditions.join(', ') || undefined, score: numberCell(overall),
        metrics: {...Object.fromEntries(parts.map((name,i) => [name,numberCell(cells[i])])), explanation: Number(explanation === '✓')} };
    }), 9);
  },
};
export default board;
