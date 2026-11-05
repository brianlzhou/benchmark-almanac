// FACTS Grounding (the January 2025 version) on Kaggle Benchmarks (Google DeepMind). Kaggle keeps each board
// version at versions/<n>. Version 1 (runs from 2025-05 to 2025-08) still uses the original judges and matches
// the lab cards (Gemini 2.5 Pro 87.8). Versions 2 and 3 use the new judges and belong to FACTS Grounding v2.
// The "Score" task, a fraction, is the score (0 to 100). The board's "Public Score" and "Private Score" (the
// public and held-out halves) are kept as metrics.public and metrics.private (0 to 100). Read through the
// helper in kaggle-game-arena.ts.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRows } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'facts-grounding',
  url: 'https://www.kaggle.com/benchmarks/google/facts-grounding/versions/1',
  feed: kaggleFeed('google', 'facts-grounding/versions/1'),
  terms: KAGGLE_TERMS,
  aliases: {},
  fetch: () =>
    kaggleRows('google', 'facts-grounding/versions/1', 'Score', 100, {
      public: { task: 'Public Score', scale: 100 },
      private: { task: 'Private Score', scale: 100 },
    }),
};
export default board;
