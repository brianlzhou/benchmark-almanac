// SG-LegalClarify tests legal question answering and selective clarification on Singapore law.
// Table 2 gives mandatory rubric scores as percentages in closed-book and web-enabled settings.
// The reported uncertainty is the sample standard deviation over the retained seeds.
import type { Leaderboard } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';

const feed = 'https://arxiv.org/html/2611.19643';
const board: Leaderboard = {
  benchmark: 'sg-legalclarify', url: feed, feed, static: 'paper',
  terms: 'The authors publish their paper under the license linked at https://arxiv.org/abs/2611.19643.',
  async fetch() {
    const table = inlinePaperTables(await paperHtml(feed)).find(t => t[0].join('|') === '|Model|Closed book|Web enabled');
    if (!table) throw new Error('Missing combined mandatory scores');
    const rows = table.slice(1).flatMap(([,model,...cells]) => cells.map((cell,i) => {
      const trials = cell.includes('\\dagger') ? 1 : cell.includes('^{*}') ? 2 : 3;
      const numbers = cell.replace(/\^\{(?:\*|\\dagger)\}/g, '').replaceAll('\\!', '').split('\\pm').map(numberCell);
      if (numbers.length !== (trials === 1 ? 1 : 2)) throw new Error('Invalid run summary for ' + model);
      return {model, setting: i === 0 ? 'Closed book' : 'Web enabled', trials, score: numbers[0],
        ...(trials > 1 ? {metrics: {std: numbers[1]}} : {})};
    }));
    return checked(rows,38);
  },
};
export default board;
