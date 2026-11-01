// Harvey Legal Agent Benchmark (LAB) v1.0, run by Vals AI for Harvey on vals.ai, read through the helper in vals-index.ts.
import type { Leaderboard } from './types.ts';
import { VALS_ALIASES, VALS_TERMS, valsPage, valsRows } from './vals-index.ts';

const SLUG = 'hlab-v1';

const board: Leaderboard = {
  benchmark: 'harvey-lab-legal-agent-benchmark',
  url: valsPage(SLUG),
  feed: `${valsPage(SLUG)} (server-rendered leaderboard table)`,
  terms: VALS_TERMS,
  aliases: VALS_ALIASES,
  fetch: () => valsRows(SLUG),
};
export default board;
