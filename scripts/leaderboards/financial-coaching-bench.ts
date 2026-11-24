// Financial Coaching Bench: Vals AI runs the board. Read with the shared Vals reader: accuracy with its interval, cost per test,
// latency and output tokens where the page gives them.
import type { Leaderboard } from './types.ts';
import { valsRows, valsPage, VALS_STATS, VALS_TERMS, VALS_ALIASES } from './vals-index.ts';

const SLUG = 'financial-coaching-bench';
const board: Leaderboard = {
  benchmark: 'financial-coaching-bench',
  url: valsPage(SLUG),
  feed: `${valsPage(SLUG)} (the page's results table, through the shared Vals reader)`,
  terms: VALS_TERMS,
  parts: {
    length_controlled: { name: 'Length-controlled', group: 'Task' },
    elicitation: { name: 'Elicitation', group: 'Task' },
  },
  stats: VALS_STATS,
  aliases: VALS_ALIASES,
  async fetch() {
    const rows = await valsRows(SLUG, { tasks: { length_controlled: 'length_controlled', elicitation: 'elicitation' } });
    if (rows.length < 3) throw new Error(`Financial Coaching Bench: ${rows.length} models, expected at least 3`);
    return rows;
  },
};
export default board;
