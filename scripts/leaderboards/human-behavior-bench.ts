// Human Behavior Bench on Kaggle Benchmarks (Rehearsals). The "Combined Score" task, 1 minus the total variation
// distance between predicted and real answer shares over public and private tasks, is the score, times 100 so
// the two-decimal rounding in the sync keeps model gaps. Read through the helper in kaggle-game-arena.ts.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRows } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'human-behavior-bench',
  url: 'https://www.kaggle.com/benchmarks/rehearsals/human-behavior-bench',
  feed: kaggleFeed('rehearsals', 'human-behavior-bench'),
  terms: KAGGLE_TERMS,
  aliases: {},
  parts: {
    public: { name: 'Public', group: 'Split' },
    private: { name: 'Private', group: 'Split' },
  },
  fetch: () => kaggleRows('rehearsals', 'human-behavior-bench', 'Combined Score', 100, {
    public: { task: 'Public Score', scale: 100 },
    private: { task: 'Private Score', scale: 100 },
  }),
};
export default board;
