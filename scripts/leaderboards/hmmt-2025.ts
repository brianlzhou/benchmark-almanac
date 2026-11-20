// HMMT February 2025 (30 final-answer problems) on MathArena, read through the helper in aime-2026.ts.
import { matharenaRows } from '../lib/boards/matharena.ts';
import type { Leaderboard } from './types.ts';
import { MATHARENA_SPRING_2025_ALIASES, MATHARENA_TERMS, matharenaFeed, matharenaPage } from './aime-2026.ts';

const COMP = 'hmmt--hmmt_feb_2025';

const board: Leaderboard = {
  benchmark: 'hmmt-2025',
  host: 'MathArena',
  url: matharenaPage(COMP),
  feed: matharenaFeed(COMP),
  terms: MATHARENA_TERMS,
  aliases: MATHARENA_SPRING_2025_ALIASES,
  fetch: () => matharenaRows(COMP),
};
export default board;
