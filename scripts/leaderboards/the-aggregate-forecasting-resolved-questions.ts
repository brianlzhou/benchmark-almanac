// The Aggregate Forecasting Resolved Questions reports Brier score for each evaluated model.
// The benchmark page loads the maker’s versioned results module.
import type { Leaderboard } from './types.ts';
import { aggregateRows } from './the-aggregate-exotic-fact-recall.ts';

const feed = "https://theaggregate.ai/our-benchmarks/forecasting";

const board: Leaderboard = {
  benchmark: "the-aggregate-forecasting-resolved-questions",
  url: "https://theaggregate.ai/benchmark?slug=the-aggregate-forecasting-resolved-questions",
  feed,
  terms: "Credit The Aggregate when quoting or charting scores. Bulk republication requires written permission. https://theaggregate.ai/terms robots.txt allows the feed path.",
  async fetch() {
    const rows = await aggregateRows(feed, 'forecasting', 9);
    // The module dates the whole campaign, without giving an evaluation date for each model.
    return rows.map(({ date, ...row }) => row);
  },
};
export default board;
