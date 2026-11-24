// Vals AI publishes LegalBench task scores, token prices, per-test costs, intervals and timing in its chart data.
import type { Leaderboard } from './types.ts';
import { VALS_ALIASES, VALS_TERMS, valsPage, VALS_LATENCY_CHART } from './vals-index.ts';

import { VALS_DETAILS_STATS, valsDetails } from '../lib/boards/vals-details.ts';

const SLUG = 'legal_bench';

const board: Leaderboard = {
  benchmark: 'legalbench',
  host: 'Vals AI',
  url: valsPage(SLUG),
  feed: `${valsPage(SLUG)} (server-rendered leaderboard table)`,
  terms: VALS_TERMS,
  chart: VALS_LATENCY_CHART,
  aliases: {
    ...VALS_ALIASES,
    'Qwen 2.5 Instruct Turbo (72B)': 'qwen2-5-72b',
    'Qwen 2.5 Instruct Turbo (7B)': 'qwen2-5-7b',
    'Gemini 1.0 Pro 002': 'gemini-1-0-pro',
  },
  stats: { ...VALS_DETAILS_STATS, priceIn: { name: 'Input price', unit: 'usd-per-mtok', better: 'lower' }, priceOut: { name: 'Output price', unit: 'usd-per-mtok', better: 'lower' }, latency: { name: 'Latency', unit: 'seconds', better: 'lower' } },
  fetch: () => valsDetails(board, SLUG, { cost: null }),
};
export default board;
