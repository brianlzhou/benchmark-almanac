// The Aggregate scores five predictions about a trip. Its benchmark module lists the overall score for every model and reasoning setting.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { aggregateRows } from './the-aggregate-exotic-fact-recall.ts';

const feed = "https://theaggregate.ai/our-benchmarks/trip-outcomes";

const board: Leaderboard = {
  benchmark: "the-aggregate-trip-outcome-prediction",
  url: "https://theaggregate.ai/benchmark?slug=the-aggregate-trip-outcome-prediction-5-questions",
  feed,
  terms: "Credit The Aggregate when quoting or charting scores. Bulk republication requires written permission. https://theaggregate.ai/terms The feed host publishes robots.txt at https://theaggregate.ai/robots.txt.",
  async fetch() {
    return aggregateRows(feed, 'trip-outcomes', 36);
  },
};
export default board;
