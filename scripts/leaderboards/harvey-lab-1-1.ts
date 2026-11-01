// Harvey Legal Agent Benchmark (LAB) v1.1, run by Vals AI for Harvey (headline Task Pass Rate) on vals.ai, read through the helper in vals-index.ts.
import type { Leaderboard } from './types.ts';
import { VALS_ALIASES, VALS_TERMS, valsPage, valsRows } from './vals-index.ts';

const SLUG = 'hlab';

const board: Leaderboard = {
  benchmark: 'harvey-lab-1-1',
  url: valsPage(SLUG),
  feed: `${valsPage(SLUG)} (server-rendered leaderboard table)`,
  terms: VALS_TERMS,
  aliases: VALS_ALIASES,
  fetch: () => valsRows(SLUG, { score: 'Task Pass Rate' }),
};
export default board;
