// AIME 2025 (I and II, 30 final-answer problems) on MathArena, read through the helper in aime-2026.ts.
import type { Leaderboard } from './types.ts';
import { MATHARENA_SPRING_2025_ALIASES, MATHARENA_TERMS, matharenaFeed, matharenaPage, matharenaRows } from './aime-2026.ts';

const COMP = 'aime--aime_2025';

const board: Leaderboard = {
  benchmark: 'aime-2025',
  url: matharenaPage(COMP),
  feed: matharenaFeed(COMP),
  terms: MATHARENA_TERMS,
  aliases: MATHARENA_SPRING_2025_ALIASES,
  fetch: () => matharenaRows(COMP),
};
export default board;
