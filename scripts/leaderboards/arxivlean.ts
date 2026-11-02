// ArXivLean on MathArena. MathArena keeps one table per set (March, June and September 2026) and no overall
// table, so this reads the September 2026 set, the one the almanac record links to. Read through the helper in
// aime-2026.ts.
import type { Leaderboard } from './types.ts';
import { MATHARENA_ALIASES, MATHARENA_TERMS, matharenaFeed, matharenaPage, matharenaRows } from './aime-2026.ts';

const COMP = 'arxivlean--september';

const board: Leaderboard = {
  benchmark: 'arxivlean',
  url: matharenaPage(COMP),
  feed: matharenaFeed(COMP),
  terms: MATHARENA_TERMS,
  aliases: MATHARENA_ALIASES,
  fetch: () => matharenaRows(COMP),
};
export default board;
