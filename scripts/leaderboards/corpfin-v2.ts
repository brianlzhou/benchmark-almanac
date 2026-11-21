// Vals CorpFin v2 (archived by Vals; its cost column is token prices, so no cost per task) on vals.ai, read through the helper in vals-index.ts.
import type { Leaderboard } from './types.ts';
import { VALS_ALIASES, VALS_TERMS, valsPage } from './vals-index.ts';

import { valsDetails } from '../lib/boards/vals-details.ts';

const SLUG = 'corp_fin_v2';

const board: Leaderboard = {
  benchmark: 'corpfin-v2',
  url: valsPage(SLUG),
  feed: `${valsPage(SLUG)} (server-rendered leaderboard table)`,
  terms: VALS_TERMS,
  aliases: VALS_ALIASES,
  stats: { priceIn: { name: 'Input price', unit: 'usd-per-mtok', better: 'lower' }, priceOut: { name: 'Output price', unit: 'usd-per-mtok', better: 'lower' }, latency: { name: 'Latency', unit: 'seconds', better: 'lower' } },
  fetch: () => valsDetails(board, SLUG, { cost: null }),
};
export default board;
