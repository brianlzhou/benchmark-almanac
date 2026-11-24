// Harvey Legal Agent Benchmark (LAB) v1.0, run by Vals AI for Harvey on vals.ai, read through the helper in vals-index.ts.
import type { Leaderboard } from './types.ts';
import { VALS_ALIASES, VALS_TERMS, valsPage, VALS_LATENCY_CHART } from './vals-index.ts';

import { VALS_DETAILS_STATS, valsDetails } from '../lib/boards/vals-details.ts';

const SLUG = 'hlab-v1';

const board: Leaderboard = {
  benchmark: 'harvey-lab-legal-agent-benchmark',
  url: valsPage(SLUG),
  feed: `${valsPage(SLUG)} (server-rendered leaderboard table)`,
  terms: VALS_TERMS,
  chart: VALS_LATENCY_CHART,
  aliases: VALS_ALIASES,
  stats: { ...VALS_DETAILS_STATS, inputTokensTotal: { name: 'Total input tokens', unit: 'tokens', better: 'lower' }, outputTokensTotal: { name: 'Total output tokens', unit: 'tokens', better: 'lower' }, reasoningTokensTotal: { name: 'Total reasoning tokens', unit: 'tokens', better: 'lower' }, latency: { name: 'Latency', unit: 'seconds', better: 'lower' } },
  fetch: () => valsDetails(board, SLUG),
};
export default board;
