// AIME 2025 (I and II, 30 final-answer problems) on MathArena, including input tokens, average retries, and rank.
import type { Leaderboard } from './types.ts';
import { MATHARENA_SPRING_2025_ALIASES, MATHARENA_TERMS, matharenaFeed, matharenaPage } from './aime-2026.ts';

import { MATHARENA_STATS, matharenaRows } from '../lib/boards/matharena.ts';

const COMP = 'aime--aime_2025';

const board: Leaderboard = {
  benchmark: 'aime-2025',
  host: 'MathArena',
  url: matharenaPage(COMP),
  feed: matharenaFeed(COMP),
  terms: MATHARENA_TERMS,
  aliases: MATHARENA_SPRING_2025_ALIASES,
  stats: MATHARENA_STATS,
  fetch: () => matharenaRows(COMP),
};
export default board;
