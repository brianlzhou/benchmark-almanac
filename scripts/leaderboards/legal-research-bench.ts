// Vals Legal Research Bench (headline All-Pass) on vals.ai, read through the helper in vals-index.ts.
import type { Leaderboard } from './types.ts';
import { VALS_ALIASES, VALS_TERMS, valsPage, VALS_LATENCY_CHART } from './vals-index.ts';

import { VALS_DETAILS_STATS, valsDetails } from '../lib/boards/vals-details.ts';

const SLUG = 'legal_research';

const board: Leaderboard = {
  benchmark: 'legal-research-bench',
  url: valsPage(SLUG),
  feed: `${valsPage(SLUG)} (server-rendered leaderboard table)`,
  terms: VALS_TERMS,
  chart: { ...VALS_LATENCY_CHART, title: 'All-Pass against latency', y: { ...VALS_LATENCY_CHART.y, label: 'All-Pass' } },
  aliases: VALS_ALIASES,
  stats: { ...VALS_DETAILS_STATS, latency: { name: 'Latency', unit: 'seconds', better: 'lower' }, turns: { name: 'Turns per test', unit: 'count', better: 'lower' } },
  fetch: () => valsDetails(board, SLUG, { score: 'All-Pass' }),
};
export default board;
