// Vals Multimodal Index v1.1: Vals AI runs the board. Read with the shared Vals reader: accuracy with its interval, cost per test,
// latency and output tokens where the page gives them.
import type { Leaderboard } from './types.ts';
import { valsRows, valsPage, VALS_TERMS, VALS_ALIASES } from './vals-index.ts';

const SLUG = 'vals_multimodal_index_v1_1';
const board: Leaderboard = {
  benchmark: 'vals-multimodal-index-v1-1',
  url: valsPage(SLUG),
  feed: `${valsPage(SLUG)} (the page's results table, through the shared Vals reader)`,
  terms: VALS_TERMS,
  aliases: VALS_ALIASES,
  stats: { latency: { name: 'Latency per test', unit: 'seconds', better: 'lower' } },
  async fetch() {
    const rows = await valsRows(SLUG);
    if (rows.length < 3) throw new Error(`Vals Multimodal Index v1.1: ${rows.length} models, expected at least 3`);
    return rows;
  },
};
export default board;
