// IndicGenBench on Kaggle Benchmarks (Google DeepMind). The "Average" task, the mean of the CrossSum-In,
// Flores-In, XorQA-In and XQuAD-In task scores (already 0 to 100), is the score. Read through the helper in
// kaggle-game-arena.ts.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRows } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'indicgenbench',
  url: 'https://www.kaggle.com/benchmarks/deepmind/indic-gen-bench',
  feed: kaggleFeed('deepmind', 'indic-gen-bench'),
  terms: KAGGLE_TERMS,
  aliases: {},
  parts: {
    crossSumIn: 'CrossSum-In',
    floresIn: 'Flores-In',
    xorQaIn: 'XorQA-In',
    xquadIn: 'XQuAD-In',
  },
  fetch: () => kaggleRows('deepmind', 'indic-gen-bench', 'Average', 1, {
    crossSumIn: { task: 'CrossSum-In' },
    floresIn: { task: 'Flores-In' },
    xorQaIn: { task: 'XorQA-In' },
    xquadIn: { task: 'XQuAD-In' },
  }),
};
export default board;
