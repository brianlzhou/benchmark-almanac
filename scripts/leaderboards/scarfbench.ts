// ScarfBench on Kaggle Benchmarks (IBM Research). The headline task is "Percent of Smoke Tests Passed" (already
// 0 to 100). Compile and Deploy are gates. Each run names its agent and reasoning setting, which become the
// harness and setting. Read through the helper in kaggle-game-arena.ts.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRows } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'scarfbench',
  harnesses: 'system',
  stats: {
    compile: { name: 'Compile pass rate', unit: '%', better: 'higher' },
    deploy: { name: 'Deploy pass rate', unit: '%', better: 'higher' },
  },
  url: 'https://www.kaggle.com/benchmarks/ibm-research/scarfbench',
  feed: kaggleFeed('ibm-research', 'scarfbench'),
  terms: KAGGLE_TERMS,
  aliases: {},
  fetch: () => kaggleRows('ibm-research', 'scarfbench', 'Percent of Smoke Tests Passed', 1, {
    compile: { task: 'Compile', scale: 100 },
    deploy: { task: 'Deploy', scale: 100 },
  }),
};
export default board;
