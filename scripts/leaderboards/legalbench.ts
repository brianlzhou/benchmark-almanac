// LegalBench as Vals AI runs it on vals.ai (its cost columns are token prices, so no per-task cost is kept),
// read through the helper in vals-index.ts. LegalBench's own authors publish no live board.
import type { Leaderboard } from './types.ts';
import { VALS_ALIASES, VALS_TERMS, valsPage, valsRows } from './vals-index.ts';

const SLUG = 'legal_bench';

const board: Leaderboard = {
  benchmark: 'legalbench',
  host: 'Vals AI',
  url: valsPage(SLUG),
  feed: `${valsPage(SLUG)} (server-rendered leaderboard table)`,
  terms: VALS_TERMS,
  aliases: {
    ...VALS_ALIASES,
    'Qwen 2.5 Instruct Turbo (72B)': 'qwen2-5-72b',
    'Qwen 2.5 Instruct Turbo (7B)': 'qwen2-5-7b',
    'Gemini 1.0 Pro 002': 'gemini-1-0-pro',
  },
  fetch: () => valsRows(SLUG, { cost: null }),
};
export default board;
