// ArXivMath, MathArena's overall table across the monthly arXiv sets (models run on every month; others show N/A and are skipped) on MathArena, read through the helper in aime-2026.ts.
import type { Leaderboard } from './types.ts';
import { MATHARENA_ALIASES, MATHARENA_TERMS, matharenaFeed, matharenaPage, matharenaRows } from './aime-2026.ts';

const COMP = 'overall--arxivmath';

const board: Leaderboard = {
  benchmark: 'arxivmath',
  url: matharenaPage(COMP),
  feed: matharenaFeed(COMP),
  terms: MATHARENA_TERMS,
  aliases: MATHARENA_ALIASES,
  fetch: () => matharenaRows(COMP),
};
export default board;
