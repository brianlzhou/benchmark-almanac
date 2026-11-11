// FrontierMath Erdős: the fraction of proof problems solved in Epoch's exact Erdős task.
import type { Leaderboard } from './types.ts';
import { EPOCH_COV1_FEED, epochCov1Rows } from '../lib/boards/epoch-cov1.ts';
const board: Leaderboard = {
  benchmark: 'frontiermath-erdos',
  url: 'https://epoch.ai/benchmarks/frontiermath-erdos',
  feed: `${EPOCH_COV1_FEED} (FrontierMath-Erdos)`,
  terms: 'Epoch AI publishes its benchmark data under CC BY 4.0; the Almanac credits and links Epoch AI.',
  fetch: () => epochCov1Rows('FrontierMath-Erdos'),
};
export default board;
