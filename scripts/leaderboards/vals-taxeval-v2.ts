// Vals TaxEval v2 (archived by Vals; its cost column is token prices, so no cost per task) on vals.ai, read through the helper in vals-index.ts.
import type { Leaderboard } from './types.ts';
import { VALS_ALIASES, VALS_TERMS, valsPage, VALS_LATENCY_CHART } from './vals-index.ts';

import { VALS_DETAILS_STATS, valsDetails } from '../lib/boards/vals-details.ts';

const SLUG = 'tax_eval_v2';

const board: Leaderboard = {
  benchmark: 'vals-taxeval-v2',
  url: valsPage(SLUG),
  feed: `${valsPage(SLUG)} (server-rendered leaderboard table)`,
  terms: VALS_TERMS,
  chart: VALS_LATENCY_CHART,
  aliases: VALS_ALIASES,
  stats: { ...VALS_DETAILS_STATS, latency: { name: 'Latency', unit: 'seconds', better: 'lower' }, priceIn: { name: 'Input price', unit: 'usd-per-mtok', better: 'lower' }, priceOut: { name: 'Output price', unit: 'usd-per-mtok', better: 'lower' } },
  fetch: () => valsDetails(board, SLUG, { cost: null }),
};
export default board;
