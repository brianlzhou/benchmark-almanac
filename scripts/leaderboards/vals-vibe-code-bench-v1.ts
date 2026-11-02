// Vals Vibe Code Bench v1 (the archived first version, whose headline is Score and whose runs name their harness)
// on vals.ai, read through the helper in vals-index.ts.
import type { Leaderboard } from './types.ts';
import { VALS_ALIASES, VALS_TERMS, valsPage, valsRows } from './vals-index.ts';

const SLUG = 'vibe-code-v1';

const board: Leaderboard = {
  benchmark: 'vals-vibe-code-bench-v1',
  url: valsPage(SLUG),
  feed: `${valsPage(SLUG)} (server-rendered leaderboard table)`,
  terms: VALS_TERMS,
  aliases: VALS_ALIASES,
  fetch: () => valsRows(SLUG, { score: 'Score', harness: 'Harness' }),
};
export default board;
