// Vision2Web S4-2026: fixed judge and agent cohort. Other seasons have separate benchmark records.
// Pinning the season prevents a future refresh from mixing scores from different judges.
import type { Leaderboard } from './types.ts';
import { VISION2WEB_FEED, VISION2WEB_TERMS, vision2webSeason } from '../lib/boards/vision2web-cov5.ts';
const board: Leaderboard = {
  benchmark: 'vision2web',
  url: 'https://vision2web-bench.github.io/',
  feed: `${VISION2WEB_FEED} (S4-2026)`,
  terms: VISION2WEB_TERMS,
  fetch: () => vision2webSeason('S4-2026'),
};
export default board;
