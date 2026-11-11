// FrontierMath Tier 4 v2 private set. Epoch's headline fraction is converted to percent.
import type { Leaderboard } from './types.ts';
import { EPOCH_RUNS_FEED, epochRunRows } from '../lib/boards/epoch-runs.ts';
const board: Leaderboard = {
  benchmark: 'frontiermath-tier-4-v2',
  url: 'https://epoch.ai/benchmarks/frontiermath-tier-4-v2',
  feed: `${EPOCH_RUNS_FEED} (FrontierMath-Tier-4-v2-Private)`,
  terms: 'Epoch AI publishes its benchmark data under CC BY 4.0; the Almanac credits and links Epoch AI.',
  fetch: () => epochRunRows('FrontierMath-Tier-4-v2-Private'),
};
export default board;
