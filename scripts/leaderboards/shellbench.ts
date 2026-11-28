// ShellBench on Kaggle Benchmarks (openclaw-foundation), read through Kaggle's documented public leaderboard endpoint with the
// helper in kaggle-game-arena.ts. The board's "Overall Pass@1 (100 Tasks)" task is the score, a fraction shown as a percentage.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRows } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'shellbench',
  url: 'https://www.kaggle.com/benchmarks/openclaw-foundation/shellbench',
  feed: kaggleFeed('openclaw-foundation', 'shellbench'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRows('openclaw-foundation', 'shellbench', "Overall Pass@1 (100 Tasks)", 100),
};
export default board;
