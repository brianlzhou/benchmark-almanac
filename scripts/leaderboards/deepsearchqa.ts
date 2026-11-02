// DeepSearchQA on Kaggle Benchmarks (run by Google DeepMind), read through the helper in
// kaggle-game-arena.ts (Kaggle's documented public leaderboard endpoint). The board's tasks are "Fully
// Correct", "Fully Incorrect", "Correct w/ Excessive Answers" and "F1", each a fraction. The board sorts by
// Fully Correct, the figure Google cites (66.1% for its Deep Research agent), so Fully Correct × 100 is the
// score. Some model cards cite F1 instead, which runs higher.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRows } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'deepsearchqa',
  url: 'https://www.kaggle.com/benchmarks/google/dsqa',
  feed: `${kaggleFeed('google', 'dsqa')} (Fully Correct)`,
  terms: KAGGLE_TERMS,
  aliases: {
    'Gemini 3.1 Pro Preview': 'gemini-3-1-pro',
  },
  fetch: () => kaggleRows('google', 'dsqa', 'Fully Correct', 100),
};
export default board;
