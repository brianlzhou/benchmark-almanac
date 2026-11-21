// ArtEdit-Bench-Eval tests how closely image-editing evaluators agree with human annotations.
// Table 2 reports Spearman rank correlation first and Pearson correlation alongside it.
import type { Leaderboard } from './types.ts';
import { paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { paperTables, grid, checked } from '../lib/boards/arxiv-span-tables.ts';
const feed = 'https://arxiv.org/html/2511.23002';
const board: Leaderboard = {
  benchmark:'artedit-bench-eval', static:'paper', url:feed, feed,
  terms:'The authors publish Table 2 on arXiv. https://arxiv.org/abs/2511.23002',
  stats:{plcc:{name:'Pearson linear correlation coefficient',unit:'score',better:'higher'}},
  async fetch() {
    const tables = paperTables((await paperHtml(feed)).replace(/<cite\b[^>]*>[\s\S]*?<\/cite>/gi,'')).map(grid);
    const table = tables.find(t => t[0][0] === 'Method' && t[0][1]?.startsWith('SRCC') && t[0][2]?.startsWith('PLCC'));
    if (!table) throw new Error('Missing evaluation correlations');
    const rows = table.slice(1).filter(c => c[0] !== c[1]).map(([label,srcc,plcc]) => ({
      model:label.replace(/[∗*]|\(\s*\)/g,'').trim(),
      setting:/[∗*]/.test(label) ? 'Fixed prompt, image quality only' : 'Instruction following and image quality',
      score:numberCell(srcc), metrics:{plcc:numberCell(plcc)},
    }));
    return checked(rows,6);
  },
};
export default board;
