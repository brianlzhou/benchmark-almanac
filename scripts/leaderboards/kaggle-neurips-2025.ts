// Kaggle’s NeurIPS 2025 leaderboard scores conference tasks. The public download contains the overall percentage and individual task results.
import type { Leaderboard } from './types.ts';
import { kaggleExpertTasks } from './kaggle-icml-2025-experts.ts';

const FEED = "https://www.kaggle.com/api/v1/benchmarks/kaggle/neurips-2025/leaderboard";

const board: Leaderboard = {
  benchmark: "kaggle-neurips-2025",
  url: "https://www.kaggle.com/benchmarks/kaggle/neurips-2025",
  feed: FEED,
  terms: "Kaggle documents its public download endpoint at https://www.kaggle.com/docs/benchmarks. Kaggle terms apply at https://www.kaggle.com/terms. The robots URL returns HTML.",
  async fetch() {
    return kaggleExpertTasks(FEED, 10, board);
  },
};
export default board;
