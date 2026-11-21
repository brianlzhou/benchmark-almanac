// FinEva measures financial passage reranking in Chinese. The FinMTEB workbook publishes the FinEvaReranking scores.
import type { Leaderboard } from './types.ts';
import { financeTask } from './finmteb-complaints-clustering.ts';

const FEED = "https://huggingface.co/spaces/FinanceMTEB/FinMTEB/resolve/main/benchmark.xlsx";

const board: Leaderboard = {
  benchmark: "fineva-reranking",
  url: "https://huggingface.co/spaces/FinanceMTEB/FinMTEB",
  feed: FEED,
  terms: "The Space declares Apache 2.0. https://huggingface.co/spaces/FinanceMTEB/FinMTEB/blob/main/README.md Hugging Face allows crawling.",
  async fetch() {
    return financeTask(FEED, 'Reranking_zh', 'FinEvaReranking', 7);
  },
};
export default board;
