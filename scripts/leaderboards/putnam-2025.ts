// Putnam 2025 on MathArena (human-graded proofs). MathArena shows the share of the 120 points, while the almanac
// record scores Putnam in points out of 120, so the percentage is converted (85.83% is 103 points). Read
// through the helper in aime-2026.ts.
import type { Leaderboard } from './types.ts';
import { MATHARENA_ALIASES, MATHARENA_TERMS, matharenaFeed, matharenaPage, matharenaRows } from './aime-2026.ts';

const COMP = 'putnam--putnam_2025';

const board: Leaderboard = {
  benchmark: 'putnam-2025',
  host: 'MathArena',
  url: matharenaPage(COMP),
  feed: matharenaFeed(COMP),
  terms: MATHARENA_TERMS,
  aliases: MATHARENA_ALIASES,
  fetch: async () => (await matharenaRows(COMP)).map((r) => ({ ...r, score: Math.round(r.score * 1.2 * 10) / 10 })),
};
export default board;
