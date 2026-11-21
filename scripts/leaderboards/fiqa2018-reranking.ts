// Models rank eleven candidate answers to personal finance questions. Each test row has one designated answer.
// FinMTEB publishes the FiQA2018Reranking scores in its Reranking_en workbook sheet.
import type { Leaderboard } from './types.ts';
import { financeTask } from './finmteb-complaints-clustering.ts';

const feed = "https://huggingface.co/spaces/FinanceMTEB/FinMTEB/resolve/main/benchmark.xlsx";
const board: Leaderboard = {
  benchmark: "fiqa2018-reranking",
  url: "https://huggingface.co/spaces/FinanceMTEB/FinMTEB",
  terms: "Hugging Face allows crawling. The FinMTEB Space declares Apache 2.0.",
  feed,
  async fetch() {
    const rows = await financeTask(feed, "Reranking_en", "FiQA2018Reranking", 18);
    return rows;
  },
};
export default board;
