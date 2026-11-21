// FrontierMath Tier 4 v2 private set. Epoch's headline fraction is converted to percent.
import type { Leaderboard } from './types.ts';
import { EPOCH_RUNS_FEED, EPOCH_SCORE_STATS, epochRunRows } from '../lib/boards/epoch-runs.ts';
const board: Leaderboard = {
  benchmark: 'frontiermath-tier-4-v2',
  url: 'https://epoch.ai/benchmarks/frontiermath-tier-4-v2',
  feed: `${EPOCH_RUNS_FEED} (FrontierMath-Tier-4-v2-Private)`,
  terms: 'Epoch AI publishes its benchmark data under CC BY 4.0; the Almanac credits and links Epoch AI.',
  stats: { meanScore: EPOCH_SCORE_STATS.meanScore, 'scorer:verification_code': EPOCH_SCORE_STATS['scorer:verification_code'], 'scorerSpread:verification_code': EPOCH_SCORE_STATS['scorerSpread:verification_code'], 'Training compute (FLOP)': EPOCH_SCORE_STATS['Training compute (FLOP)'], activeParams: EPOCH_SCORE_STATS.activeParams, 'Hardware quantity': { ...EPOCH_SCORE_STATS['Hardware quantity'], name: 'Hardware count' } },
  fetch: () => epochRunRows('FrontierMath-Tier-4-v2-Private'),
};
export default board;
