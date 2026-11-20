// Harvey Legal Agent Benchmark (LAB) v1.0, run by Vals AI for Harvey on vals.ai, read through the helper in vals-index.ts.
import type { Leaderboard } from './types.ts';
import { VALS_ALIASES, VALS_TERMS, valsPage } from './vals-index.ts';

import { valsDetails } from '../lib/boards/vals-details.ts';

const SLUG = 'hlab-v1';

const board: Leaderboard = {
  benchmark: 'harvey-lab-legal-agent-benchmark',
  url: valsPage(SLUG),
  feed: `${valsPage(SLUG)} (server-rendered leaderboard table)`,
  terms: VALS_TERMS,
  aliases: VALS_ALIASES,
  fetch: () => valsDetails(board, SLUG),
};
export default board;
