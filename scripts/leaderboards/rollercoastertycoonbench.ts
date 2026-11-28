// RollerCoasterTycoonBench: Vals AI runs the board. Read with the shared Vals reader: accuracy with its interval, cost per test,
// latency and output tokens where the page gives them.
import type { Leaderboard } from './types.ts';
import { valsRows, valsPage, VALS_LATENCY_CHART, VALS_STATS, VALS_TERMS, VALS_ALIASES } from './vals-index.ts';

const SLUG = 'rctbench';
const board: Leaderboard = {
  benchmark: 'rollercoastertycoonbench',
  url: valsPage(SLUG),
  feed: `${valsPage(SLUG)} (the page's results table, through the shared Vals reader)`,
  terms: VALS_TERMS,
  aliases: VALS_ALIASES,
  stats: VALS_STATS,
  chart: VALS_LATENCY_CHART,
  async fetch() {
    const rows = await valsRows(SLUG, { cost: 'Cost / run' });
    if (rows.length < 3) throw new Error(`RollerCoasterTycoonBench: ${rows.length} models, expected at least 3`);
    return rows;
  },
};
export default board;
