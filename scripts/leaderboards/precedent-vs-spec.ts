// Precedent vs. Spec (Kaggle Benchmarks, by finnmead): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column, a fraction shown here as a percentage.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'precedent-vs-spec',
  url: 'https://www.kaggle.com/benchmarks/finnmead/precedent-vs-spec',
  feed: kaggleFeed('finnmead', 'precedent-vs-spec'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('finnmead', 'precedent-vs-spec', "(Overall)", 100),
};
export default board;
