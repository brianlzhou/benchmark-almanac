// FACTS Multimodal on Kaggle Benchmarks (Google DeepMind). The "Score" task, a fraction over the public and
// private prompts, is the score (0 to 100). Coverage and Factuality are breakdowns. Read through the helper in
// kaggle-game-arena.ts.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRows } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'facts-multimodal',
  url: 'https://www.kaggle.com/benchmarks/google/facts-multimodal',
  feed: kaggleFeed('google', 'facts-multimodal'),
  terms: KAGGLE_TERMS,
  aliases: {},
  fetch: () => kaggleRows('google', 'facts-multimodal', 'Score', 100),
};
export default board;
