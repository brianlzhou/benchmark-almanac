// USAMO 2026 (proofs graded by human judges, 0 to 100%) on MathArena, read through the helper in aime-2026.ts.
import type { Leaderboard } from './types.ts';
import { MATHARENA_ALIASES, MATHARENA_TERMS, matharenaFeed, matharenaPage, matharenaRows } from './aime-2026.ts';

const COMP = 'usamo--usamo_2026';

const board: Leaderboard = {
  benchmark: 'usamo-2026',
  url: matharenaPage(COMP),
  feed: matharenaFeed(COMP),
  terms: MATHARENA_TERMS,
  aliases: MATHARENA_ALIASES,
  fetch: () => matharenaRows(COMP),
};
export default board;
