// The Aggregate Day-one Recall Check reports Accuracy for each evaluated model.
// The benchmark page loads the maker’s versioned results module.
import type { Leaderboard } from './types.ts';
import { aggregateRows } from './the-aggregate-exotic-fact-recall.ts';

const feed = "https://theaggregate.ai/our-benchmarks/recall-check";

const board: Leaderboard = {
  benchmark: "the-aggregate-day-one-recall-check",
  url: "https://theaggregate.ai/benchmark?slug=the-aggregate-day-one-recall-check",
  feed,
  terms: "Credit The Aggregate when quoting or charting scores. Bulk republication requires written permission. https://theaggregate.ai/terms robots.txt allows the feed path.",
  stats: { items: { name: 'Items', unit: 'count' } },
  async fetch() {
    const rows = await aggregateRows(feed, 'recall-check', 45);
    // The module dates the whole campaign, without giving an evaluation date for each model.
    return rows.map(({ date, ...row }) => row);
  },
};
export default board;
