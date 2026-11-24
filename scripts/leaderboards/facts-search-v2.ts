// FACTS Search V2 on Kaggle Benchmarks (Google DeepMind): version 2 of the FACTS Search board, published
// 2026-07-27, read at versions/2 so a later version 3 does not land here unnoticed. The "Score" task, a
// fraction, is the score (0 to 100), with its confidence interval as `ciLow` and `ciHigh`. The board's other columns kept as
// metrics: "Average Searches" per question (`searches`), and "Hedging Rate", "Attempted Accuracy" and "F1" (0
// to 100: `hedging`, `attempted`, `f1`). Read through the helper in kaggle-game-arena.ts.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRows } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'facts-search-v2',
  parts: {
    public: { name: 'Public', group: 'Split' },
    private: { name: 'Private', group: 'Split' },
  },
  url: 'https://www.kaggle.com/benchmarks/google/facts-search',
  feed: kaggleFeed('google', 'facts-search/versions/2'),
  terms: KAGGLE_TERMS,
  aliases: {},
  stats: { searches: { name: 'Average searches', unit: 'count', better: 'lower' }, hedging: { name: 'Hedging rate', unit: '%', better: 'lower' }, attempted: { name: 'Attempted accuracy', unit: '%', better: 'higher' }, f1: { name: 'F1', unit: '%', better: 'higher' } },
  fetch: () =>
    kaggleRows('google', 'facts-search/versions/2', 'Score', 100, {
      public: { task: 'Public Score', scale: 100, interval: true },
      private: { task: 'Private Score', scale: 100, interval: true },
      searches: { task: 'Average Searches' },
      hedging: { task: 'Hedging Rate', scale: 100 },
      attempted: { task: 'Attempted Accuracy', scale: 100 },
      f1: { task: 'F1', scale: 100 },
    }),
};
export default board;
