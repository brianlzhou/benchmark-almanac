// Paragraph Instruction Following (Kaggle Benchmarks, by lwolwo): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'paragraph-instruction-following',
  url: 'https://www.kaggle.com/benchmarks/lwolwo/paragraph-instruction-following',
  feed: kaggleFeed('lwolwo', 'paragraph-instruction-following'),
  terms: KAGGLE_TERMS,
  parts: {
    split0: 'Split 0',
    split1: 'Split 1',
    split2: 'Split 2',
    split3: 'Split 3',
  },
  fetch: () => kaggleRowsWithBounds('lwolwo', 'paragraph-instruction-following', "(Overall)", 1, {
    split0: { task: 'diverse-paragraph-v2-s0' },
    split1: { task: 'diverse-paragraph-v2-s1' },
    split2: { task: 'diverse-paragraph-v2-s2' },
    split3: { task: 'diverse-paragraph-v2-s3' },
  }),
};
export default board;
