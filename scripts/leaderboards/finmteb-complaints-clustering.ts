// ComplaintsClustering compares financial embeddings by how well they group complaints by product. The FinMTEB Space publishes the scores in the English clustering worksheet.
import type { Leaderboard } from './types.ts';
import { fetchBytes } from '../lib/util.ts';
import { readXlsx } from './superclue.ts';

const FEED = "https://huggingface.co/spaces/FinanceMTEB/FinMTEB/resolve/main/benchmark.xlsx";

export async function financeTask(feed: string, sheet: string, column: string, minimum: number) {
  const table = readXlsx(Buffer.from(await fetchBytes(feed))).get(sheet);
  const index = table?.[0].indexOf(column) ?? -1;
  if (!table || index < 0 || table[0][0] !== 'Model' || table[0][1] !== 'URL') throw new Error(`Missing ${sheet}/${column}`);
  const rows = table.slice(1).filter((r) => r[index]?.trim() && r[index].trim() !== '-').map((r) => {
    const score = Number(r[index]);
    if (!r[0] || !Number.isFinite(score)) throw new Error(`Invalid ${column} score for ${r[0]}`);
    return { model: r[0], score, link: r[1]?.startsWith('https://') ? r[1] : undefined };
  });
  if (rows.length < minimum) throw new Error(`Expected at least ${minimum} scores for ${column}`);
  return rows;
}

const board: Leaderboard = {
  benchmark: "finmteb-complaints-clustering",
  url: "https://huggingface.co/spaces/FinanceMTEB/FinMTEB",
  feed: FEED,
  terms: "The leaderboard Space declares Apache 2.0. The score workbook is in this Space. https://huggingface.co/spaces/FinanceMTEB/FinMTEB/blob/main/README.md Hugging Face allows crawling in robots.txt.",
  async fetch() {
    return financeTask(FEED, 'Clustering_en', 'ComplaintsClustering', 18);
  },
};
export default board;
