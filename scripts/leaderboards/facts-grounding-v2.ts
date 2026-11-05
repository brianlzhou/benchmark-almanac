// FACTS Grounding on Kaggle Benchmarks (run by Google DeepMind), read through Kaggle's documented public
// leaderboard endpoint (kaggle.com/docs/benchmarks), as simpleqa-verified.ts does. The board's tasks are
// "Score" (the headline, a fraction shown as a percentage), "Public Score" and "Private Score". Kaggle now
// runs FACTS Grounding v2 (new judges), so its numbers sit below the v1 scores in older model cards. The
// FACTS suite board (google/facts) averages four tasks and is not this benchmark.
// Rows are read through kaggleRows in kaggle-game-arena.ts, which also keeps the Score's confidence interval as
// metrics.ciLow and ciHigh (times 100, like the score).
import type { Leaderboard } from './types.ts';
import { kaggleRows } from './kaggle-game-arena.ts';

const FEED = 'https://www.kaggle.com/api/v1/benchmarks/google/facts-grounding/leaderboard';

const board: Leaderboard = {
  benchmark: 'facts-grounding-v2',
  url: 'https://www.kaggle.com/benchmarks/google/facts-grounding',
  feed: FEED,
  terms: "Kaggle's documented public leaderboard download endpoint; Kaggle's terms of use apply.",
  aliases: {
    'Gemini 3.1 Pro Preview': 'gemini-3-1-pro',
  },
  fetch: () => kaggleRows('google', 'facts-grounding', 'Score', 100),
};
export default board;
