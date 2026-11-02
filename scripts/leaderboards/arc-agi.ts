// ARC-AGI-1 on the ARC Prize leaderboard. The page loads one pre-joined JSON file per version from
// /media/data/leaderboard/, and v1.json holds the ARC-AGI-1 semi-private set (scores are fractions of
// tasks solved, 0 to 1). The reader and the shared display-name aliases live in arc-agi-2.ts.
import type { Leaderboard } from './types.ts';
import arc2, { arcFeed, arcRows } from './arc-agi-2.ts';

// arcRows is typed for v2 and v3, but the feed layout is the same for v1
const V1 = 'v1' as 'v2';

const board: Leaderboard = {
  benchmark: 'arc-agi',
  url: 'https://arcprize.org/leaderboard',
  feed: arcFeed(V1),
  terms: 'Public JSON file the ARC Prize leaderboard page loads; robots.txt allows all paths.',
  aliases: { ...arc2.aliases },
  fetch: () => arcRows(V1),
};
export default board;
