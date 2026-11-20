// Vision2Web S4-2026: fixed judge and agent cohort. Other seasons have separate benchmark records.
// Pinning the season prevents a future refresh from mixing scores from different judges.
import type { Leaderboard } from './types.ts';
import { VISION2WEB_FEED, VISION2WEB_TERMS, vision2webSeason } from '../lib/boards/vision2web.ts';
const board: Leaderboard = {
  benchmark: 'vision2web',
  parts: {
    l1_desktop: { name: 'Level 1 desktop', group: 'Category' },
    l1_tablet: { name: 'Level 1 tablet', group: 'Category' },
    l1_mobile: { name: 'Level 1 mobile', group: 'Category' },
    l1_avg: { name: 'Level 1', group: 'Difficulty' },
    l2_avg: { name: 'Level 2', group: 'Difficulty' },
    l3_avg: { name: 'Level 3', group: 'Difficulty' },
    l2_vs: { name: 'Level 2 visual score', group: 'Dimension' },
    l2_fs: { name: 'Level 2 functional score', group: 'Dimension' },
    l3_vs: { name: 'Level 3 visual score', group: 'Dimension' },
    l3_fs: { name: 'Level 3 functional score', group: 'Dimension' },
  },
  url: 'https://vision2web-bench.github.io/',
  feed: `${VISION2WEB_FEED} (S4-2026)`,
  terms: VISION2WEB_TERMS,
  fetch: () => vision2webSeason('S4-2026'),
};
export default board;
