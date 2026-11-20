// Vision2Web S1-2026: fixed judge and agent cohort. Other seasons have separate benchmark records.
// Pinning the season prevents a future refresh from mixing scores from different judges.
import type { Leaderboard } from './types.ts';
import { VISION2WEB_FEED, VISION2WEB_TERMS, vision2webSeason } from '../lib/boards/vision2web.ts';
const board: Leaderboard = {
  benchmark: 'vision2web-s1-2026',
  parts: {
    l1_desktop: { name: 'Level 1 desktop', group: 'Task type' },
    l1_tablet: { name: 'Level 1 tablet', group: 'Task type' },
    l1_mobile: { name: 'Level 1 mobile', group: 'Task type' },
    l1_avg: { name: 'Level 1', group: 'Difficulty' },
    l2_avg: { name: 'Level 2', group: 'Difficulty' },
    l3_avg: { name: 'Level 3', group: 'Difficulty' },
    l2_vs: { name: 'Level 2 visual score', group: 'Dimension' },
    l2_fs: { name: 'Level 2 functional score', group: 'Dimension' },
    l3_vs: { name: 'Level 3 visual score', group: 'Dimension' },
    l3_fs: { name: 'Level 3 functional score', group: 'Dimension' },
  },
  url: 'https://vision2web-bench.github.io/',
  feed: `${VISION2WEB_FEED} (S1-2026)`,
  terms: VISION2WEB_TERMS,
  fetch: () => vision2webSeason('S1-2026'),
};
export default board;
