// Vals Legal Research Bench (headline All-Pass) on vals.ai, read through the helper in vals-index.ts.
import type { Leaderboard } from './types.ts';
import { VALS_ALIASES, VALS_TERMS, valsPage } from './vals-index.ts';

import { valsDetails } from '../lib/boards/vals-details.ts';

const SLUG = 'legal_research';

const board: Leaderboard = {
  benchmark: 'legal-research-bench',
  url: valsPage(SLUG),
  feed: `${valsPage(SLUG)} (server-rendered leaderboard table)`,
  terms: VALS_TERMS,
  aliases: VALS_ALIASES,
  fetch: () => valsDetails(board, SLUG, { score: 'All-Pass' }),
};
export default board;
