// Shop Assistant Honesty Bench (UA/RU) (Kaggle Benchmarks, by dimatopka): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column, a fraction shown here as a percentage.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'shop-assistant-honesty-bench-ua-ru',
  url: 'https://www.kaggle.com/benchmarks/dimatopka/shop-assistant-honesty-bench-uaru',
  feed: kaggleFeed('dimatopka', 'shop-assistant-honesty-bench-uaru'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('dimatopka', 'shop-assistant-honesty-bench-uaru', "(Overall)", 100),
};
export default board;
