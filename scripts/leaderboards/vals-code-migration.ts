// Vals Code Migration v1 (the archived first version, while v1.1 is vals-code-migration-1-1) on vals.ai, read through
// the helper in vals-index.ts.
import type { Leaderboard } from './types.ts';
import { VALS_ALIASES, VALS_TERMS, valsPage } from './vals-index.ts';

import { valsDetails } from '../lib/boards/vals-details.ts';

const SLUG = 'code-migration';

const board: Leaderboard = {
  benchmark: 'vals-code-migration',
  url: valsPage(SLUG),
  feed: `${valsPage(SLUG)} (server-rendered leaderboard table)`,
  terms: VALS_TERMS,
  aliases: VALS_ALIASES,
  stats: { latency: { name: 'Latency', unit: 'seconds', better: 'lower' }, turns: { name: 'Turns per test', unit: 'count', better: 'lower' } },
  fetch: () => valsDetails(board, SLUG),
};
export default board;
