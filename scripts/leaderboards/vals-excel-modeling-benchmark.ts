// Vals Excel Modeling Benchmark v1.0 on vals.ai, read through the helper in vals-index.ts.
import type { Leaderboard } from './types.ts';
import { VALS_ALIASES, VALS_TERMS, valsPage } from './vals-index.ts';

import { valsDetails } from '../lib/boards/vals-details.ts';

const SLUG = 'emb';

const board: Leaderboard = {
  benchmark: 'vals-excel-modeling-benchmark',
  url: valsPage(SLUG),
  feed: `${valsPage(SLUG)} (server-rendered leaderboard table)`,
  terms: VALS_TERMS,
  aliases: VALS_ALIASES,
  stats: { latency: { name: 'Latency', unit: 'seconds', better: 'lower' }, turns: { name: 'Turns per test', unit: 'count', better: 'lower' } },
  fetch: () => valsDetails(board, SLUG),
};
export default board;
