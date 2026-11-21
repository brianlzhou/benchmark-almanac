// Vals SAGE v1 (the archived first version, whose cost columns are token prices, so no per-task cost is kept) on
// vals.ai, read through the helper in vals-index.ts.
import type { Leaderboard } from './types.ts';
import { VALS_ALIASES, VALS_TERMS, valsPage } from './vals-index.ts';

import { valsDetails } from '../lib/boards/vals-details.ts';

const SLUG = 'sage-v1';

const board: Leaderboard = {
  benchmark: 'vals-sage',
  url: valsPage(SLUG),
  feed: `${valsPage(SLUG)} (server-rendered leaderboard table)`,
  terms: VALS_TERMS,
  aliases: VALS_ALIASES,
  stats: { latency: { name: 'Latency', unit: 'seconds', better: 'lower' }, priceIn: { name: 'Input price', unit: 'usd-per-mtok', better: 'lower' }, priceOut: { name: 'Output price', unit: 'usd-per-mtok', better: 'lower' } },
  fetch: () => valsDetails(board, SLUG, { cost: null }),
};
export default board;
