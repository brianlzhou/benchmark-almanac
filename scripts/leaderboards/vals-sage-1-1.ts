// Vals SAGE v1.1 on vals.ai, read through the helper in vals-index.ts. Its "Total Cost" column is the US dollars
// of each model's whole run, kept as cost with costPer 'run'.
import type { Leaderboard } from './types.ts';
import { VALS_ALIASES, VALS_LATENCY_CHART, VALS_STATS, VALS_TERMS, valsPage, valsRows } from './vals-index.ts';

const SLUG = 'sage';

const board: Leaderboard = {
  benchmark: 'vals-sage-1-1',
  url: valsPage(SLUG),
  feed: `${valsPage(SLUG)} (server-rendered leaderboard table)`,
  terms: VALS_TERMS,
  aliases: VALS_ALIASES,
  parts: {
    PDEs: { name: 'Partial differential equations', group: 'Subject' },
    linear_algebra: { name: 'Linear algebra', group: 'Subject' },
    cs: { name: 'Computer science', group: 'Subject' },
  },
  stats: VALS_STATS,
  chart: VALS_LATENCY_CHART,
  costPer: 'run',
  fetch: () => valsRows(SLUG, { cost: 'Total Cost', tasks: { PDEs: 'PDEs', linear_algebra: 'linear_algebra', cs: 'cs' } }),
};
export default board;
