// The Aggregate Asteroid Numbers reports Accuracy for each evaluated model.
// The benchmark page loads the maker’s versioned results module.
import type { Leaderboard } from './types.ts';
import { aggregateRows } from './the-aggregate-exotic-fact-recall.ts';

const feed = "https://theaggregate.ai/our-benchmarks/asteroid-numbers";

const board: Leaderboard = {
  benchmark: "the-aggregate-asteroid-numbers",
  url: "https://theaggregate.ai/benchmark?slug=the-aggregate-asteroid-numbers",
  feed,
  terms: "Credit The Aggregate when quoting or charting scores. Bulk republication requires written permission. https://theaggregate.ai/terms robots.txt allows the feed path.",
  async fetch() {
    const rows = await aggregateRows(feed, 'asteroid-numbers', 10);
    // The module dates the whole campaign, without giving an evaluation date for each model.
    return rows.map(({ date, metrics: _, ...row }) => row);
  },
};
export default board;
