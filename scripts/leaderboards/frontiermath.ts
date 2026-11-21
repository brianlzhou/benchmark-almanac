// Original private FrontierMath, exact February 2025 task identifier. Never mix the v2 or public task sets.
import type { Leaderboard } from './types.ts';
import { EPOCH_RUNS_FEED, EPOCH_SCORE_STATS, epochRunRows } from '../lib/boards/epoch-runs.ts';
const board: Leaderboard = {
  benchmark: 'frontiermath',
  url: 'https://epoch.ai/frontiermath',
  feed: `${EPOCH_RUNS_FEED} (FrontierMath-2025-02-28-Private)`,
  terms: 'Epoch AI publishes its benchmark data under CC BY 4.0; the Almanac credits and links Epoch AI.',
  stats: { meanScore: EPOCH_SCORE_STATS.meanScore, 'scorer:verification_code': EPOCH_SCORE_STATS['scorer:verification_code'], 'scorerSpread:verification_code': EPOCH_SCORE_STATS['scorerSpread:verification_code'], 'Training compute (FLOP)': EPOCH_SCORE_STATS['Training compute (FLOP)'], 'Training compute cost (2023 USD)': EPOCH_SCORE_STATS['Training compute cost (2023 USD)'], 'Training dataset size (datapoints)': EPOCH_SCORE_STATS['Training dataset size (datapoints)'], 'Hardware quantity': { ...EPOCH_SCORE_STATS['Hardware quantity'], name: 'Hardware count' }, activeParams: EPOCH_SCORE_STATS.activeParams },
  fetch: () => epochRunRows('FrontierMath-2025-02-28-Private'),
};
export default board;
