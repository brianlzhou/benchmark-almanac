// Grade Your Own Homework: Can LLMs Judge Each Other (Kaggle Benchmarks, by anish23101): read through the helper in kaggle-game-arena.ts, Kaggle's documented
// public leaderboard endpoint. The headline is the board's "(Overall)" column.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRowsWithBounds } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'grade-your-own-homework-can-llms-judge-each-other',
  url: 'https://www.kaggle.com/benchmarks/anish23101/grade-your-own-homework-can-llms-judge-each-other',
  feed: kaggleFeed('anish23101', 'grade-your-own-homework-can-llms-judge-each-other'),
  terms: KAGGLE_TERMS,
  parts: {
    homework: 'Homework',
    gradingAccuracy: 'Grading accuracy',
    ownMistakes: 'Own mistakes',
    positionSwap: 'Position swap',
    confidenceBait: 'Confidence bait',
    nameOnAnswer: 'Name on answer',
    whichIsMine: 'Which is mine',
    solveFirst: 'Solve first',
  },
  fetch: () => kaggleRowsWithBounds('anish23101', 'grade-your-own-homework-can-llms-judge-each-other', "(Overall)", 1, {
    homework: { task: 'ggh-homework' },
    gradingAccuracy: { task: 'ggh-grading-accuracy' },
    ownMistakes: { task: 'ggh-own-mistakes' },
    positionSwap: { task: 'ggh-position-swap' },
    confidenceBait: { task: 'ggh-confidence-bait' },
    nameOnAnswer: { task: 'ggh-name-on-answer' },
    whichIsMine: { task: 'ggh-which-is-mine' },
    solveFirst: { task: 'ggh-solve-first' },
  }),
};
export default board;
