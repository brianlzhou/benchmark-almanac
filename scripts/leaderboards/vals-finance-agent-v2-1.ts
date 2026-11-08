// Vals Finance Agent v2.1 (the current Finance Agent page, a revision of v2 with a new judge jury) on vals.ai, read through the helper in vals-index.ts.
import type { Leaderboard } from './types.ts';
import { VALS_ALIASES, VALS_TERMS, VALS_LATENCY_CHART, valsPage, valsRows } from './vals-index.ts';

const SLUG = 'fabv2-1';

const board: Leaderboard = {
  benchmark: 'vals-finance-agent-v2-1',
  url: valsPage(SLUG),
  feed: `${valsPage(SLUG)} (server-rendered leaderboard table)`,
  terms: VALS_TERMS,
  aliases: VALS_ALIASES,
  chart: VALS_LATENCY_CHART,
  fetch: () => valsRows(SLUG),
};
export default board;
