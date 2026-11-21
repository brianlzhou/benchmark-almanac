// Models group company descriptions by industry. The score measures how well the groups recover the industry labels.
// FinMTEB publishes the WikiCompany2IndustryClustering scores in its Clustering_en workbook sheet.
import type { Leaderboard } from './types.ts';
import { financeTask } from './finmteb-complaints-clustering.ts';

const feed = "https://huggingface.co/spaces/FinanceMTEB/FinMTEB/resolve/main/benchmark.xlsx";
const board: Leaderboard = {
  benchmark: "wikicompany2industry-clustering",
  url: "https://huggingface.co/spaces/FinanceMTEB/FinMTEB",
  terms: "Hugging Face allows crawling. The FinMTEB Space declares Apache 2.0.",
  feed,
  async fetch() {
    const rows = await financeTask(feed, "Clustering_en", "WikiCompany2IndustryClustering", 18);
    return rows;
  },
};
export default board;
