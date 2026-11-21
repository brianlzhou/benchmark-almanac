// Kaggle’s Task Tuesday board measures performance on community tasks. Its leaderboard endpoint reports an overall score and task results.
import type { Leaderboard } from './types.ts';
import { kaggleExpertTasks } from './kaggle-icml-2025-experts.ts';

const FEED = "https://www.kaggle.com/api/v1/benchmarks/kaggle/kaggles-task-tuesday-benchmark/leaderboard";

const board: Leaderboard = {
  benchmark: "kaggle-kaggles-task-tuesday-benchmark",
  url: "https://www.kaggle.com/benchmarks/kaggle/kaggles-task-tuesday-benchmark",
  feed: FEED,
  terms: "Kaggle documents its public download endpoint at https://www.kaggle.com/docs/benchmarks. Kaggle terms apply at https://www.kaggle.com/terms. The robots URL returns HTML.",
  async fetch() {
    return kaggleExpertTasks(FEED, 6, board);
  },
};
export default board;
