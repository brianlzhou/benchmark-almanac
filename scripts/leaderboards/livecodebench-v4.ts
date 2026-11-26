// LiveCodeBench v4 on Kaggle Benchmarks (open-benchmarks), read through Kaggle's documented public leaderboard endpoint with the
// helper in kaggle-game-arena.ts. The board's "Score" task is the score, a fraction shown as a percentage.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRows } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'livecodebench-v4',
  host: 'Kaggle',
  url: 'https://www.kaggle.com/benchmarks/open-benchmarks/livecodebench-release-v4',
  feed: kaggleFeed('open-benchmarks', 'livecodebench-release-v4'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRows('open-benchmarks', 'livecodebench-release-v4', "Score", 100),
};
export default board;
