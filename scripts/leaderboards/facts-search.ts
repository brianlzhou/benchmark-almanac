// FACTS Search (the first version) on Kaggle Benchmarks (Google DeepMind). Kaggle keeps each board version at
// versions/<n>. Version 1 (runs 2025-11 to 2025-12) is this record and version 2 is facts-search-v2. The
// "Score" task, a fraction, is the score (0 to 100). Read through the helper in kaggle-game-arena.ts, which keeps
// the score's CI. The board's other tasks are kept as metrics: Hedging Rate (`hedging`, %), Attempted Accuracy
// (`attempted`, %), F1 (`f1`, %) and Average Searches (`searches`, per question).
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'facts-search',
  parts: {
    public: { name: 'Public', group: 'Split' },
    private: { name: 'Private', group: 'Split' },
  },
  url: 'https://www.kaggle.com/benchmarks/google/facts-search/versions/1',
  feed: kaggleFeed('google', 'facts-search/versions/1'),
  terms: KAGGLE_TERMS,
  aliases: {},
  stats: { searches: { name: 'Average searches', unit: 'count', better: 'lower' }, hedging: { name: 'Hedging rate', unit: '%', better: 'lower' }, attempted: { name: 'Attempted accuracy', unit: '%', better: 'higher' }, f1: { name: 'F1', unit: '%', better: 'higher' } },
  fetch: () =>
    kaggleRowsWithBounds('google', 'facts-search/versions/1', 'Score', 100, {
      public: { task: 'Public Score', scale: 100, interval: true },
      private: { task: 'Private Score', scale: 100, interval: true },
      hedging: { task: 'Hedging Rate', scale: 100 },
      attempted: { task: 'Attempted Accuracy', scale: 100 },
      f1: { task: 'F1', scale: 100 },
      searches: { task: 'Average Searches' },
    }),
};
export default board;
