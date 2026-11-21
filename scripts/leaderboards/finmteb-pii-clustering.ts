// PiiClustering compares financial embeddings. The FinMTEB workbook supplies the task score for each model.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { financeTask } from './finmteb-complaints-clustering.ts';

const feed = "https://huggingface.co/spaces/FinanceMTEB/FinMTEB/resolve/main/benchmark.xlsx";

const board: Leaderboard = {
  benchmark: "finmteb-pii-clustering",
  url: "https://huggingface.co/spaces/FinanceMTEB/FinMTEB",
  feed,
  terms: "The Space declares Apache 2.0. https://huggingface.co/spaces/FinanceMTEB/FinMTEB/blob/main/README.md Hugging Face allows the workbook in robots.txt.",
  fetch: () => financeTask(feed, "Clustering_en", "PiiClustering", 18),
};

export default board;
