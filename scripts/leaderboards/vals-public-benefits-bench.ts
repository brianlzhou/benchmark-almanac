// Vals Public Benefits Bench on vals.ai, read through the helper in vals-index.ts.
import type { Leaderboard } from './types.ts';
import { VALS_ALIASES, VALS_LATENCY_CHART, VALS_STATS, VALS_TERMS, valsPage, valsRows } from './vals-index.ts';

const SLUG = 'public-benefits-bench';

const board: Leaderboard = {
  benchmark: 'vals-public-benefits-bench',
  url: valsPage(SLUG),
  feed: `${valsPage(SLUG)} (server-rendered leaderboard table)`,
  terms: VALS_TERMS,
  aliases: VALS_ALIASES,
  parts: {
    neither: { name: 'Neither', group: 'Condition' },
    web_search: { name: 'Web search', group: 'Condition' },
    multi_turn: { name: 'Multi-turn', group: 'Condition' },
    both: { name: 'Both', group: 'Condition' },
  },
  stats: VALS_STATS,
  chart: VALS_LATENCY_CHART,
  fetch: () => valsRows(SLUG, { tasks: { neither: 'neither', web_search: 'web_search', multi_turn: 'multi_turn', both: 'both' } }),
};
export default board;
