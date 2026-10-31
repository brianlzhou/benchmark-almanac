// ARC-AGI-3 on the ARC Prize leaderboard: the same per-version JSON file as ARC-AGI-2. Each model has a
// standard-harness run and, for newer models, a "Provider Adapter" run; both are kept, named in `harness`.
import type { Leaderboard } from './types.ts';
import { arcFeed, arcRows } from './arc-agi-2.ts';

const board: Leaderboard = {
  benchmark: 'arc-agi-3',
  url: 'https://arcprize.org/leaderboard',
  feed: arcFeed('v3'),
  terms: 'Public JSON file the ARC Prize leaderboard page loads; robots.txt allows all paths.',
  aliases: {},
  fetch: () => arcRows('v3'),
};
export default board;
