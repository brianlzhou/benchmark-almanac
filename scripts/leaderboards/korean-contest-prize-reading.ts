// Korean Contest Prize Reading (Kaggle Benchmarks, by ohyoseok): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column, a fraction shown here as a percentage.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'korean-contest-prize-reading',
  url: 'https://www.kaggle.com/benchmarks/ohyoseok/korean-contest-prize-reading',
  feed: kaggleFeed('ohyoseok', 'korean-contest-prize-reading'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('ohyoseok', 'korean-contest-prize-reading', "(Overall)", 100),
};
export default board;
