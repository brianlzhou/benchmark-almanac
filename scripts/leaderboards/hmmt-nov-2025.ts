// HMMT November 2025 (30 final-answer problems) on MathArena, read through the helper in aime-2026.ts.
import type { Leaderboard } from './types.ts';
import { MATHARENA_ALIASES, MATHARENA_TERMS, matharenaFeed, matharenaPage, matharenaRows } from './aime-2026.ts';

const COMP = 'hmmt--hmmt_nov_2025';

const board: Leaderboard = {
  benchmark: 'hmmt-nov-2025',
  url: matharenaPage(COMP),
  feed: matharenaFeed(COMP),
  terms: MATHARENA_TERMS,
  aliases: MATHARENA_ALIASES,
  stats: { activeParams: { name: 'Active parameters', unit: 'billions' }, latency: { name: 'Time per answer', unit: 'seconds', better: 'lower' } },
  fetch: () => matharenaRows(COMP),
};
export default board;
