// FrontierMath Erdős: the fraction of proof problems solved in Epoch's exact Erdős task.
import type { Leaderboard } from './types.ts';
import { EPOCH_RUNS_FEED, EPOCH_SCORE_STATS, epochRunRows } from '../lib/boards/epoch-runs.ts';
const board: Leaderboard = {
  benchmark: 'frontiermath-erdos',
  url: 'https://epoch.ai/benchmarks/frontiermath-erdos',
  feed: `${EPOCH_RUNS_FEED} (FrontierMath-Erdos)`,
  terms: 'Epoch AI publishes its benchmark data under CC BY 4.0; the Almanac credits and links Epoch AI.',
  stats: { meanScore: EPOCH_SCORE_STATS.meanScore, 'scorer:proof_scorer': EPOCH_SCORE_STATS['scorer:proof_scorer'], 'scorerSpread:proof_scorer': EPOCH_SCORE_STATS['scorerSpread:proof_scorer'] },
  fetch: () => epochRunRows('FrontierMath-Erdos'),
};
export default board;
