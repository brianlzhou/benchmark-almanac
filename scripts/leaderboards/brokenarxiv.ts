// BrokenArXiv on MathArena: the overall table across the monthly sets of false arXiv statements, for models run
// on every month. The August 2026 set changed grading to 0 to 3, so older and newer months do not compare. Read
// through the helper in aime-2026.ts.
import type { Leaderboard } from './types.ts';
import { MATHARENA_ALIASES, MATHARENA_TERMS, matharenaFeed, matharenaPage, matharenaRows } from './aime-2026.ts';


const COMP = 'overall--brokenarxiv';

const board: Leaderboard = {
  benchmark: 'brokenarxiv',
  url: matharenaPage(COMP),
  feed: matharenaFeed(COMP),
  terms: MATHARENA_TERMS,
  aliases: MATHARENA_ALIASES,
  async fetch() {
    // The shared reader excludes estimated aggregates and keeps only observed overall results.
    return matharenaRows(COMP);
  },
};
export default board;
