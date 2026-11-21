// Models compare passages from financial reports. The score measures how well their similarity rankings distinguish revised passages from mismatched passages.
// FinMTEB publishes the FINAL scores in its STS_en workbook sheet.
import type { Leaderboard } from './types.ts';
import { financeTask } from './finmteb-complaints-clustering.ts';

const feed = "https://huggingface.co/spaces/FinanceMTEB/FinMTEB/resolve/main/benchmark.xlsx";
const board: Leaderboard = {
  benchmark: "finmteb-final",
  url: "https://huggingface.co/spaces/FinanceMTEB/FinMTEB",
  terms: "Hugging Face allows crawling. The FinMTEB Space declares Apache 2.0.",
  feed,
  async fetch() {
    const rows = await financeTask(feed, "STS_en", "FINAL", 18);
    return rows;
  },
};
export default board;
