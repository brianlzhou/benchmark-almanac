// DeepSearchQA on Kaggle Benchmarks (run by Google DeepMind), read through the helper in
// kaggle-game-arena.ts (Kaggle's documented public leaderboard endpoint). The board's tasks are "Fully
// Correct", "Fully Incorrect", "Correct w/ Excessive Answers" and "F1", each a fraction. The board sorts by
// Fully Correct, the figure Google cites (66.1% for its Deep Research agent), so Fully Correct × 100 is the
// score. Some model cards cite F1 instead, which runs higher. The other three tasks are kept as metrics (0 to
// 100: `f1`, `incorrect`, `excessive`), with the score's confidence interval as `ciLow` and `ciHigh`.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRows } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'deepsearchqa',
  url: 'https://www.kaggle.com/benchmarks/google/dsqa',
  feed: `${kaggleFeed('google', 'dsqa')} (Fully Correct)`,
  terms: KAGGLE_TERMS,
  aliases: {
    'Gemini 3.1 Pro Preview': 'gemini-3-1-pro',
    // the stable gemini-2.5-flash, the June 2025 release (not the September preview)
    'Gemini 2.5 Flash': 'gemini-2-5-flash-jun-2025',
  },
  fetch: () =>
    kaggleRows('google', 'dsqa', 'Fully Correct', 100, {
      f1: { task: 'F1', scale: 100 },
      incorrect: { task: 'Fully Incorrect', scale: 100 },
      excessive: { task: 'Correct w/ Excessive Answers', scale: 100 },
    }),
};
export default board;
