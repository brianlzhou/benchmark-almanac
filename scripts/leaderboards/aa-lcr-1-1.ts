// AA-LCR 1.1 on Kaggle Benchmarks, read through Kaggle's documented public leaderboard endpoint with the helper in
// kaggle-game-arena.ts. Artificial Analysis published the benchmark on Kaggle, and Kaggle runs the models on its own
// platform, three tries per question. The almanac still takes no scores from Artificial Analysis's site or API. The
// user chose on 2026-11-26 to read this Kaggle board. The board's "(Overall)" task is the score, a fraction shown as
// a percentage.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRows } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'aa-lcr-1-1',
  url: 'https://www.kaggle.com/benchmarks/artificial-analysis/aa-lcr',
  feed: kaggleFeed('artificial-analysis', 'aa-lcr'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRows('artificial-analysis', 'aa-lcr', "(Overall)", 100),
};
export default board;
