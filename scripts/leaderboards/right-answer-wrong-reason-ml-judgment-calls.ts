// Right Answer, Wrong Reason: ML Judgment Calls (Kaggle Benchmarks, by starkhushi): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'right-answer-wrong-reason-ml-judgment-calls',
  url: 'https://www.kaggle.com/benchmarks/starkhushi/right-answer-wrong-reason-ml-judgment-calls',
  feed: kaggleFeed('starkhushi', 'right-answer-wrong-reason-ml-judgment-calls'),
  terms: KAGGLE_TERMS,
  fetch: () => kaggleRowsWithBounds('starkhushi', 'right-answer-wrong-reason-ml-judgment-calls', "(Overall)", 1),
};
export default board;
