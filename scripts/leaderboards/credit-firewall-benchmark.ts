// Credit Firewall Benchmark (Kaggle Benchmarks, by chrissyserb): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'credit-firewall-benchmark',
  url: 'https://www.kaggle.com/benchmarks/chrissyserb/credit-firewall-benchmark',
  feed: kaggleFeed('chrissyserb', 'credit-firewall-benchmark'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('chrissyserb', 'credit-firewall-benchmark', "(Overall)", 1),
};
export default board;
