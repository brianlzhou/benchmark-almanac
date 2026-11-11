// Original private FrontierMath, exact February 2025 task identifier. Never mix the v2 or public task sets.
import type { Leaderboard } from './types.ts';
import { EPOCH_COV1_FEED, epochCov1Rows } from '../lib/boards/epoch-cov1.ts';
const board: Leaderboard = {
  benchmark: 'frontiermath',
  url: 'https://epoch.ai/frontiermath',
  feed: `${EPOCH_COV1_FEED} (FrontierMath-2025-02-28-Private)`,
  terms: 'Epoch AI publishes its benchmark data under CC BY 4.0; the Almanac credits and links Epoch AI.',
  fetch: () => epochCov1Rows('FrontierMath-2025-02-28-Private'),
};
export default board;
