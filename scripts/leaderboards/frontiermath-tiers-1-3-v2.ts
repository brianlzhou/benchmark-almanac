// FrontierMath Tiers 1–3 v2 private set. Keep exact task and evaluation settings.
// Epoch's fractional headline scores become percentages. Run token totals remain metrics.
import type { Leaderboard } from './types.ts';
import { EPOCH_COV1_FEED, epochCov1Rows } from '../lib/boards/epoch-cov1.ts';
const board: Leaderboard = {
  benchmark: 'frontiermath-tiers-1-3-v2',
  url: 'https://epoch.ai/benchmarks/frontiermath-tiers-1-3-v2',
  feed: `${EPOCH_COV1_FEED} (FrontierMath-Tiers-1-3-v2-Private)`,
  terms: 'Epoch AI publishes its benchmark data under CC BY 4.0; the Almanac credits and links Epoch AI.',
  fetch: () => epochCov1Rows('FrontierMath-Tiers-1-3-v2-Private'),
};
export default board;
