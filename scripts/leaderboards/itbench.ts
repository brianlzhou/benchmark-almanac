// ITBench (IBM Research). The GitHub LEADERBOARD_SRE.md and LEADERBOARD_CISO.md tables stopped in 2025 and
// rank agents (three SRE agents, CISO agents with no model named). The maintained board is the one IBM and
// Kaggle opened in 2025-12, kaggle.com/benchmarks/ibm-research/itbench, with one row per model and three
// tasks: SRE Score, FinOps Score and their mean, Average Score (already 0 to 100). The score is Average
// Score, read through Kaggle's documented leaderboard endpoint with the helper in kaggle-game-arena.ts. The
// two task scores are kept as metrics.sre and metrics.finops.
import type { Leaderboard } from './types.ts';
import { KAGGLE_TERMS, kaggleFeed, kaggleRows } from './kaggle-game-arena.ts';

const board: Leaderboard = {
  benchmark: 'itbench',
  url: 'https://www.kaggle.com/benchmarks/ibm-research/itbench',
  feed: kaggleFeed('ibm-research', 'itbench'),
  terms: KAGGLE_TERMS,
  aliases: {
    'Qwen 3 235B A22B Instruct 2506': 'qwen3-235b-a22b',
  },
  fetch: () => kaggleRows('ibm-research', 'itbench', 'Average Score', 1, { sre: { task: 'SRE Score' }, finops: { task: 'FinOps Score' } }),
};
export default board;
