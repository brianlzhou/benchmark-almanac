// Meta-World tests robot manipulation. Table 1 of the original benchmark paper reports average
// maximum success rates over ten seeds. MT50 covers all fifty tasks and MT10 covers ten.
import type { Leaderboard } from './types.ts';
import { PAPER_TERMS, paperHtml, numberCell } from '../lib/boards/arxiv-throttled.ts';
import { checked } from '../lib/boards/arxiv-span-tables.ts';
import { inlinePaperTables } from '../lib/boards/arxiv-inline-tables.ts';

const url = 'https://arxiv.org/html/1910.10897';
const board: Leaderboard = {
  benchmark: 'meta-world', static: 'paper', url, feed: url, terms: PAPER_TERMS,
  headline: 'The headline is MT50 training success across all 50 manipulation tasks in the original paper.',
  parts: { mt10: {name:'MT10', unit:'%'}, mt50: {name:'MT50', unit:'%'} },
  async fetch() {
    const tables = inlinePaperTables(await paperHtml(url));
    const main = tables.find(t => t[0]?.join('|') === 'Methods|MT10|MT50');
    if (!main) throw new Error('Missing original Meta-World multi-task results');
    return checked(main.slice(1).map(([model, ten, fifty]) => {
      const mt10 = numberCell(ten.replace('%',''));
      const mt50 = numberCell(fifty.replace('%',''));
      return {model, setting:'Original multi-task evaluation', score:mt50, trials:10, metrics:{mt10,mt50}};
    }),4);
  },
};
export default board;
