// The Aggregate ranks models by exact-answer accuracy on 24 inversion and execution puzzles. Its first-party benchmark module publishes the scores.
import type { Leaderboard, LeaderboardRow } from './types.ts';
import { aggregateRows } from './the-aggregate-exotic-fact-recall.ts';

const feed = "https://theaggregate.ai/our-benchmarks/inversion-ladder";

const board: Leaderboard = {
  benchmark: "the-aggregate-inversion-and-execution-ladder",
  url: "https://theaggregate.ai/benchmark?slug=the-aggregate-inversion-and-execution-ladder",
  feed,
  terms: "Credit The Aggregate when quoting scores. Bulk republication requires written permission. https://theaggregate.ai/terms The feed host publishes robots.txt at https://theaggregate.ai/robots.txt.",
  stats: { items: { name: 'Items', unit: 'count' } },
  async fetch() {
    return aggregateRows(feed, 'inversion-ladder', 27);
  },
};
export default board;
