// 1H-VideoQA on Kaggle Benchmarks (Google DeepMind). The board's single "Accuracy" task, a fraction over the
// 101 questions, is the score (0 to 100). Read through the helper in kaggle-game-arena.ts.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRows } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: '1h-videoqa-google',
  url: 'https://www.kaggle.com/benchmarks/deepmind/video-qa',
  feed: kaggleFeed('deepmind', 'video-qa'),
  terms: KAGGLE_TERMS,
  aliases: {},
  fetch: () => kaggleRows('deepmind', 'video-qa', 'Accuracy', 100),
};
export default board;
