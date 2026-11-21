// Vals Finance Agent v2 (archived: Vals superseded it with v2.1 at /benchmarks/fabv2-1, which has no record here) on vals.ai, read through the helper in vals-index.ts.
import type { Leaderboard } from './types.ts';
import { VALS_ALIASES, VALS_TERMS, valsPage } from './vals-index.ts';

import { valsDetails } from '../lib/boards/vals-details.ts';

const SLUG = 'fabv2';

const board: Leaderboard = {
  benchmark: 'vals-finance-agent-v2',
  url: valsPage(SLUG),
  feed: `${valsPage(SLUG)} (server-rendered leaderboard table)`,
  terms: VALS_TERMS,
  aliases: VALS_ALIASES,
  stats: { latency: { name: 'Latency', unit: 'seconds', better: 'lower' }, turns: { name: 'Turns per test', unit: 'count', better: 'lower' } },
  fetch: () => valsDetails(board, SLUG),
};
export default board;
