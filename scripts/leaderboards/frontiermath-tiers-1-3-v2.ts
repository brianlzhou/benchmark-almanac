// FrontierMath Tiers 1–3 v2 private set. Keep exact task and evaluation settings.
// Epoch's fractional headline scores become percentages. Run token totals remain metrics.
import type { Leaderboard } from './types.ts';
import { EPOCH_RUNS_FEED, EPOCH_SCORE_STATS, epochRunRows } from '../lib/boards/epoch-runs.ts';
const board: Leaderboard = {
  benchmark: 'frontiermath-tiers-1-3-v2',
  url: 'https://epoch.ai/benchmarks/frontiermath-tiers-1-3-v2',
  feed: `${EPOCH_RUNS_FEED} (FrontierMath-Tiers-1-3-v2-Private)`,
  terms: 'Epoch AI publishes its benchmark data under CC BY 4.0; the Almanac credits and links Epoch AI.',
  stats: EPOCH_SCORE_STATS,
  fetch: () => epochRunRows('FrontierMath-Tiers-1-3-v2-Private'),
};
export default board;
