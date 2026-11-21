// FinSTS measures semantic similarity in financial texts. The FinMTEB workbook publishes the FinSTS scores.
import type { Leaderboard } from './types.ts';
import { financeTask } from './finmteb-complaints-clustering.ts';

const FEED = "https://huggingface.co/spaces/FinanceMTEB/FinMTEB/resolve/main/benchmark.xlsx";

const board: Leaderboard = {
  benchmark: "finsts",
  url: "https://huggingface.co/spaces/FinanceMTEB/FinMTEB",
  feed: FEED,
  terms: "The leaderboard Space declares Apache 2.0. The score workbook is in this Space. https://huggingface.co/spaces/FinanceMTEB/FinMTEB/blob/main/README.md Hugging Face allows crawling.",
  async fetch() {
    return financeTask(FEED, 'STS_en', 'FinSTS', 18);
  },
};
export default board;
