// FrontierMath Tier 4 v2 private set. Epoch's headline fraction is converted to percent.
import type { Leaderboard } from './types.ts';
import { EPOCH_COV1_FEED, epochCov1Rows } from '../lib/boards/epoch-cov1.ts';
const board: Leaderboard = {
  benchmark: 'frontiermath-tier-4-v2',
  url: 'https://epoch.ai/benchmarks/frontiermath-tier-4-v2',
  feed: `${EPOCH_COV1_FEED} (FrontierMath-Tier-4-v2-Private)`,
  terms: 'Epoch AI publishes its benchmark data under CC BY 4.0; the Almanac credits and links Epoch AI.',
  fetch: () => epochCov1Rows('FrontierMath-Tier-4-v2-Private'),
};
export default board;
