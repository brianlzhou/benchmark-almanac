// Vibe Code Bench 1-100 v1.1: Vals AI runs the board. Read with the shared Vals reader: accuracy with its interval, cost per test,
// latency and output tokens where the page gives them.
import type { Leaderboard } from './types.ts';
import { valsRows, valsPage, VALS_TERMS, VALS_ALIASES } from './vals-index.ts';

const SLUG = 'vcb-1-100-v1-1';
const board: Leaderboard = {
  benchmark: 'vals-vibe-code-bench-1-100-v1-1',
  url: valsPage(SLUG),
  feed: `${valsPage(SLUG)} (the page's results table, through the shared Vals reader)`,
  terms: VALS_TERMS,
  aliases: VALS_ALIASES,
  async fetch() {
    const rows = await valsRows(SLUG);
    if (rows.length < 3) throw new Error(`Vibe Code Bench 1-100 v1.1: ${rows.length} models, expected at least 3`);
    return rows;
  },
};
export default board;
