// Autoform-Hard: Vals AI runs the board. Read with the shared Vals reader: accuracy with its interval, cost per test,
// latency and output tokens where the page gives them.
import type { Leaderboard } from './types.ts';
import { valsRows, valsPage, VALS_TERMS, VALS_ALIASES } from './vals-index.ts';

const SLUG = 'autoform_hard';
const board: Leaderboard = {
  benchmark: 'autoform-hard',
  url: valsPage(SLUG),
  feed: `${valsPage(SLUG)} (the page's results table, through the shared Vals reader)`,
  terms: VALS_TERMS,
  stats: { latency:{name:'Latency',unit:'seconds',better:'lower'} },
  aliases: VALS_ALIASES,
  async fetch() {
    const rows = await valsRows(SLUG, { cost: 'Cost / Task' });
    if (rows.length < 3) throw new Error(`Autoform-Hard: ${rows.length} models, expected at least 3`);
    return rows;
  },
};
export default board;
