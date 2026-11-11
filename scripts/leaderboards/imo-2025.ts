// IMO 2025 (proofs graded by human judges, 0 to 100% of the 42 points) on MathArena, read through the helper in aime-2026.ts.
import type { Leaderboard } from './types.ts';
import { MATHARENA_ALIASES, MATHARENA_TERMS, matharenaFeed, matharenaPage, matharenaRows } from './aime-2026.ts';

const COMP = 'imo--imo_2025';

const board: Leaderboard = {
  benchmark: 'imo-2025',
  host: 'MathArena',
  url: matharenaPage(COMP),
  feed: matharenaFeed(COMP),
  terms: MATHARENA_TERMS,
  aliases: MATHARENA_ALIASES,
  fetch: () => matharenaRows(COMP),
};
export default board;
