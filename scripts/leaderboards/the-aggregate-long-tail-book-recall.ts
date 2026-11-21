// The Aggregate Long-tail Book Recall reports Accuracy for each evaluated model.
// The benchmark page loads the maker’s versioned results module.
import type { Leaderboard } from './types.ts';
import { aggregateRows } from './the-aggregate-exotic-fact-recall.ts';

const feed = "https://theaggregate.ai/our-benchmarks/book-recall";

const board: Leaderboard = {
  benchmark: "the-aggregate-long-tail-book-recall",
  url: "https://theaggregate.ai/benchmark?slug=the-aggregate-long-tail-book-recall",
  feed,
  terms: "Credit The Aggregate when quoting scores. Bulk republication requires written permission. https://theaggregate.ai/terms robots.txt allows the feed path.",
  async fetch() {
    const rows = await aggregateRows(feed, 'book-recall', 21);
    // The module dates the whole campaign, without giving an evaluation date for each model.
    return rows.map(({ date, ...row }) => row);
  },
};
export default board;
