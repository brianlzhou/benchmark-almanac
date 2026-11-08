// MathArena Apex Shortlist (the 2025 shortlist of hard final-answer problems that the Apex set was drawn from) on
// MathArena, read through the helper in aime-2026.ts. The Apex set itself has its own importer,
// matharena-apex-imo-usamo.ts.
import type { Leaderboard } from './types.ts';
import { MATHARENA_ALIASES, MATHARENA_TERMS, matharenaFeed, matharenaPage, matharenaRows } from './aime-2026.ts';

const COMP = 'apex--shortlist_2025';

const board: Leaderboard = {
  benchmark: 'matharena-apex-shortlist',
  url: matharenaPage(COMP),
  feed: matharenaFeed(COMP),
  terms: MATHARENA_TERMS,
  aliases: MATHARENA_ALIASES,
  fetch: () => matharenaRows(COMP),
};
export default board;
