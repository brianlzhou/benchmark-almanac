// Right Answer, Wrong Reason: ML Judgment Calls (Kaggle Benchmarks, by starkhushi): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'right-answer-wrong-reason-ml-judgment-calls',
  url: 'https://www.kaggle.com/benchmarks/starkhushi/right-answer-wrong-reason-ml-judgment-calls',
  feed: kaggleFeed('starkhushi', 'right-answer-wrong-reason-ml-judgment-calls'),
  terms: KAGGLE_TERMS,
  parts: {
    dsJudgment: 'Data science judgment',
    dsJudgmentOpen: 'Open-ended data science judgment',
  },
  fetch: () => kaggleRowsWithBounds('starkhushi', 'right-answer-wrong-reason-ml-judgment-calls', "(Overall)", 1, {
    dsJudgment: { task: 'ds-judgment', interval: true },
    dsJudgmentOpen: { task: 'ds-judgment-open', interval: true },
  }),
};
export default board;
