// FACTS Multimodal on Kaggle Benchmarks (Google DeepMind). The "Score" task, a fraction over the public and
// private prompts, is the score (0 to 100). Coverage and Factuality are breakdowns. Read through the helper in
// kaggle-game-arena.ts.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'facts-multimodal',
  parts: {
    public: { name: 'Public', group: 'Split' },
    private: { name: 'Private', group: 'Split' },
  },
  stats: {
    coverage: { name: 'Coverage', unit: '%', better: 'higher' },
    factuality: { name: 'Factuality', unit: '%', better: 'higher' },
  },
  url: 'https://www.kaggle.com/benchmarks/google/facts-multimodal',
  feed: kaggleFeed('google', 'facts-multimodal'),
  terms: KAGGLE_TERMS,
  aliases: {},
  fetch: () => kaggleRowsWithBounds('google', 'facts-multimodal', 'Score', 100, {
    public: { task: 'Public Score', scale: 100, interval: true },
    private: { task: 'Private Score', scale: 100, interval: true },
    coverage: { task: 'Coverage', scale: 100 },
    factuality: { task: 'Factuality', scale: 100 },
  }),
};
export default board;
